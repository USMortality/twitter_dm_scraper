export const delay = (time) =>
  new Promise((resolve) => {
    setTimeout(resolve, time)
  })

export const makeSequence = (start, end) => {
  const result = []
  for (let i = start; i <= end; i++) result.push(i.toString())
  return result
}

export const waitUntilLoaded = async (page) => {
  await page.waitForFunction(() => document.readyState === 'complete')
  await delay(1000)
}

