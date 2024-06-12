import { test } from '@playwright/test'
import { writeFile } from 'fs'
import { delay } from './common.js'

// CONFIG:
const TWITTER_USER = process.env.TWITTER_USER
const TWITTER_PASSWORD = process.env.TWITTER_PASSWORD
const TWITTER_MESSAGE_ID = process.env.TWITTER_MESSAGE_ID
const TWITTER_ME_TITLE = process.env.TWITTER_ME_TITLE ?? 'Me: '
const TWITTER_THEM_TITLE = process.env.TWITTER_THEM_TITLE ?? 'Them: '

const TWITTER_DM_URL = `https://twitter.com/messages/${TWITTER_MESSAGE_ID}`

test('retrieve twitter dm', async ({ page }) => {
  await page.goto('https://twitter.com/')
  await page.getByTestId('loginButton').click()
  await page.getByLabel('Phone, email, or username').click()
  await page.getByLabel('Phone, email, or username').fill(TWITTER_USER)
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByLabel('Password', { exact: true }).click()
  await page.getByLabel('Password', { exact: true }).fill(TWITTER_PASSWORD)
  await page.getByTestId('LoginForm_Login_Button').click()

  await page.setViewportSize({ width: 600, height: 720 })
  await page.getByTestId('AppTabBar_DirectMessage_Link').click()
  await page.goto(TWITTER_DM_URL)

  let lastMessage = ''
  const messages = new Set()
  await page.getByTestId('DmScrollerContainer').waitFor()

  while (true) {
    const firstMsgLoc = await page.getByTestId('tweetText').first()
    const msgLoc = await page.getByTestId('tweetText').all()

    for (const msg of msgLoc.reverse()) {
      // Based on background color, determine author.
      const parentHandle = await msg.evaluateHandle((el) => el.parentElement)
      const backgroundColor = await parentHandle.evaluate((el) => {
        const computedStyle = window.getComputedStyle(el)
        return computedStyle.backgroundColor
      })
      const prefix =
        backgroundColor === 'rgb(29, 155, 240)'
          ? TWITTER_ME_TITLE
          : TWITTER_THEM_TITLE
      messages.add(`${prefix}: ${await msg.textContent()}`)
    }

    const message = await firstMsgLoc.innerText()
    if (lastMessage === message) break
    lastMessage = message
    await firstMsgLoc.scrollIntoViewIfNeeded()
    await delay(1000)
  }

  const result = Array.from(messages).reverse()
  const resultHandler = (err) => {
    if (err) {
      console.error('Error writing file:', err)
      return
    }
    console.log('Saved.')
  }

  // Write the JSON data to a file
  const jsonData = JSON.stringify(result, null, 2)
  writeFile(
    `./out/twitter/${TWITTER_MESSAGE_ID}.json`,
    jsonData,
    'utf8',
    resultHandler
  )

  const textContent = result.join('\n\n')
  // Write the text content to a .txt file
  writeFile(
    `./out/twitter/${TWITTER_MESSAGE_ID}.txt`,
    textContent,
    'utf8',
    resultHandler
  )
})
