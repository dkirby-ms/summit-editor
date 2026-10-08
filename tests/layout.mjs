import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { chromium } from '@playwright/test'
import { createServer } from 'vite'

let server
let browser
let baseUrl

before(async () => {
  server = await createServer({ server: { host: '127.0.0.1', port: 0 } })
  await server.listen()
  baseUrl = server.resolvedUrls.local[0]
  browser = await chromium.launch()
})

after(async () => {
  await browser?.close()
  await server?.close()
})

const viewports = [
  { width: 1920, height: 1080, maxPageHeight: 1700 },
  { width: 1366, height: 768, maxPageHeight: 1800 },
  { width: 1099, height: 763, maxPageHeight: 1900 },
  { width: 1050, height: 800 },
  { width: 768, height: 1024 },
  { width: 700, height: 900 },
  { width: 390, height: 844 },
  { width: 320, height: 640 },
]

for (const { width, height, maxPageHeight } of viewports) {
  test(`compact panel reflows without clipping at ${width} x ${height}`, async () => {
    const page = await browser.newPage({ viewport: { width, height } })
    try {
      await page.goto(baseUrl)
      await page.evaluate(() => document.fonts.ready)
      const verifyLayout = async () => {
        const layout = await page.evaluate(() => {
          const visible = (element) => element.getClientRects().length > 0
          const describe = (element) => element.id || element.getAttribute('aria-label') || element.textContent
          return {
            pageWidth: document.documentElement.scrollWidth,
            pageHeight: document.documentElement.scrollHeight,
            clipped: [...document.querySelectorAll('.parameter-control, .peak-module-title, .lfo-selector button')]
              .filter(visible)
              .filter((element) => element.scrollWidth > element.clientWidth + 1)
              .map(describe),
            smallTargets: [...document.querySelectorAll('button, select, [role="slider"], input[type="range"]')]
              .filter(visible)
              .filter((element) => {
                const bounds = element.getBoundingClientRect()
                return bounds.width < 24 || bounds.height < 24
              })
              .map(describe),
          }
        })
        assert.ok(layout.pageWidth <= width, `Page overflows horizontally: ${layout.pageWidth}px`)
        if (maxPageHeight) {
          assert.ok(layout.pageHeight <= maxPageHeight, `Page exceeds ${maxPageHeight}px budget: ${layout.pageHeight}px`)
        }
        assert.deepEqual(layout.clipped, [], 'Control content must not be clipped')
        assert.deepEqual(layout.smallTargets, [], 'Interactive targets must be at least 24 x 24px')
      }
      await verifyLayout()
      const keybed = await page.locator('.piano-bed').evaluate((bed) => {
        const whites = [...bed.querySelectorAll('.white-key')]
        const blacks = [...bed.querySelectorAll('.black-key')]
        const whiteBounds = whites[0].getBoundingClientRect()
        const blackBounds = blacks[0].getBoundingClientRect()
        const boundaries = [1, 2, 4, 5, 6]
        return {
          whiteCount: whites.length,
          blackCount: blacks.length,
          availableWidth: bed.clientWidth,
          overflows: bed.scrollWidth > bed.clientWidth || bed.parentElement.scrollWidth > bed.parentElement.clientWidth,
          first: whites[0].getAttribute('aria-label'),
          last: whites.at(-1).getAttribute('aria-label'),
          blackHeightRatio: blackBounds.height / whiteBounds.height,
          aligned: blacks.every((key, index) => {
            const bounds = key.getBoundingClientRect()
            const boundary = whites[Math.floor(index / 5) * 7 + boundaries[index % 5]].getBoundingClientRect().left
            return Math.abs(bounds.left + bounds.width / 2 - boundary) < 1
          }),
        }
      })
      const expectedOctaves = Math.max(1, Math.min(5, Math.floor((keybed.availableWidth * 0.7 / 24 - 1) / 7)))
      assert.equal(keybed.whiteCount, expectedOctaves * 7 + 1)
      assert.equal(keybed.blackCount, expectedOctaves * 5)
      assert.equal(keybed.overflows, false, 'The keyboard must fit without horizontal scrolling')
      assert.equal(keybed.first, 'Play C 2')
      assert.equal(keybed.last, `Play C ${2 + expectedOctaves}`)
      assert.ok(Math.abs(keybed.blackHeightRatio - 0.61) < 0.01)
      assert.equal(keybed.aligned, true, 'Black keys must follow the two/three-key grouping across all five octaves')
      const mixer = await page.locator('.mixer-module .parameter-grid').evaluate((grid) => ({
        columns: getComputedStyle(grid).gridTemplateColumns.split(' ').length,
        rows: getComputedStyle(grid).gridTemplateRows.split(' ').length,
      }))
      assert.deepEqual(mixer, { columns: 2, rows: 3 }, 'Mixer must have two columns and three rows')
      const mixerControls = await page.locator('.mixer-module .rotary-control').evaluateAll((controls) =>
        controls.map((control) => ({ id: control.id, x: control.getBoundingClientRect().x, y: control.getBoundingClientRect().y })),
      )
      assert.deepEqual(mixerControls.map(({ id }) => id), ['osc1Mix', 'ringModMix', 'osc2Mix', 'noiseMix', 'osc3Mix', 'vcaLevel'])
      for (let row = 0; row < 3; row++) {
        assert.ok(mixerControls[row * 2].x < mixerControls[row * 2 + 1].x)
        assert.equal(mixerControls[row * 2].y, mixerControls[row * 2 + 1].y)
      }
      assert.equal(await page.locator('.rotary-control').evaluateAll((knobs) => knobs.every((knob) => {
        const output = knob.nextElementSibling
        if (!output?.classList.contains('rotary-value')) return false
        const dialBounds = knob.getBoundingClientRect()
        const valueBounds = output.getBoundingClientRect()
        return valueBounds.top >= dialBounds.bottom - 1
          && Math.abs(valueBounds.x + valueBounds.width / 2 - dialBounds.x - dialBounds.width / 2) < 1
      })), true, 'Rotary values must be centered below their knobs')
      assert.equal(await page.locator('.midi-address').first().isVisible(), false)
      await page.getByRole('button', { name: 'Debug', exact: true }).click()
      assert.equal(await page.locator('.midi-address').first().isVisible(), true)
      await verifyLayout()
      await page.getByRole('button', { name: 'Debug', exact: true }).click()

      for (const name of ['Oscillator 1', 'Oscillator 2', 'Oscillator 3', 'Mixer', 'Filter', 'LFOs', 'Amp envelope', 'Mod envelopes', 'Voice & oscillator menus']) {
        assert.equal(await page.getByRole('region', { name, exact: true }).isVisible(), true, `${name} must remain visible`)
      }
      for (const name of ['LFO 2', 'LFO 3', 'LFO 4']) {
        await page.getByRole('button', { name, exact: true }).click()
        assert.equal(await page.getByRole('button', { name, exact: true }).getAttribute('aria-pressed'), 'true')
        await verifyLayout()
      }
      await page.getByRole('button', { name: 'LFO 1', exact: true }).click()
      await page.locator('#lfo1Wave').selectOption('3')
      await page.locator('#lfo1Range').selectOption('2')
      await page.locator('#filterShape').selectOption('3')
      assert.equal(await page.locator('.dual-filter').isVisible(), true)
      await page.locator('#filterShape').selectOption('0')
      assert.equal(await page.locator('.dual-filter').isVisible(), false)
      await page.locator('#filterShape').selectOption('3')
      await page.getByRole('button', { name: 'Mod env 2', exact: true }).click()
      await verifyLayout()
      const menus = page.getByRole('region', { name: 'Voice & oscillator menus' })
      for (const name of ['Osc common', 'Osc 1', 'Osc 2', 'Osc 3', 'Noise']) {
        await menus.getByRole('tab', { name, exact: true }).click()
        assert.equal(await menus.getByRole('tab', { name, exact: true }).getAttribute('aria-selected'), 'true')
        await verifyLayout()
      }
      const expandedHeight = await page.evaluate(() => document.documentElement.scrollHeight)
      const toggles = page.locator('.section-toggle')
      for (let index = (await toggles.count()) - 1; index >= 0; index--) {
        const toggle = toggles.nth(index)
        await toggle.click()
        assert.equal(await toggle.getAttribute('aria-expanded'), 'false')
        for (const id of (await toggle.getAttribute('aria-controls')).split(' ')) {
          assert.equal(await page.locator(`[id="${id}"]`).isVisible(), false)
        }
      }
      const collapsedHeight = await page.evaluate(() => document.documentElement.scrollHeight)
      assert.ok(collapsedHeight < expandedHeight, 'Collapsing sections must reduce the page footprint')
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
      const filterToggle = page.getByRole('button', { name: 'Filter', exact: true })
      await filterToggle.focus()
      await filterToggle.press('Space')
      assert.equal(await filterToggle.getAttribute('aria-expanded'), 'true')
      assert.equal(await page.getByRole('slider', { name: 'Filter frequency', exact: true }).isVisible(), true)
    } finally {
      await page.close()
    }
  })
}

test('compact knobs preserve keyboard and pointer editing', async () => {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } })
  try {
    await page.goto(baseUrl)
    const knob = page.getByRole('slider', { name: 'Oscillator 1 coarse tuning', exact: true })
    await knob.focus()
    await knob.press('ArrowUp')
    assert.equal(await knob.getAttribute('aria-valuenow'), '65')
    await knob.press('Shift+ArrowDown')
    assert.equal(await knob.getAttribute('aria-valuenow'), '55')
    await knob.scrollIntoViewIfNeeded()
    const bounds = await knob.boundingBox()
    assert.ok(bounds)
    const x = bounds.x + bounds.width / 2
    const y = bounds.y + bounds.height / 2
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x, y - 20)
    await page.mouse.up()
    assert.ok(Number(await knob.getAttribute('aria-valuenow')) > 55)
    assert.notEqual(await knob.evaluate((element) => getComputedStyle(element).outlineStyle), 'none')
    await knob.dblclick()
    assert.equal(await knob.getAttribute('aria-valuenow'), '64')
    assert.equal(await knob.getAttribute('aria-valuetext'), '0')
  } finally {
    await page.close()
  }
})

test('control help appears on hover and focus and dismisses on Escape', async () => {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } })
  try {
    await page.goto(baseUrl)
    await page.locator('#filterShape').selectOption('3')
    const help = page.getByRole('button', { name: 'Dual filter help', exact: true })
    const tooltip = page.getByRole('tooltip').filter({ hasText: 'runs in series' })
    assert.equal(await tooltip.isVisible(), false)
    await help.hover()
    assert.equal(await tooltip.isVisible(), true)
    await tooltip.hover()
    assert.equal(await tooltip.isVisible(), true)
    await page.mouse.move(0, 0)
    assert.equal(await tooltip.isVisible(), false)
    await help.focus()
    assert.equal(await tooltip.isVisible(), true)
    await help.press('Escape')
    assert.equal(await tooltip.isVisible(), false)
    await page.getByRole('slider', { name: 'Filter frequency', exact: true }).focus()
    await help.focus()
    assert.equal(await tooltip.isVisible(), true)
  } finally {
    await page.close()
  }
})
