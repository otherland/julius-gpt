import { PostPrompt } from '../types'

const STRUCTURE_OUTLINE = `Generate the blog post outline based on the relevant HTML headings from the search results for the query "{{TITLE}}". Ensure that the outline covers the topic comprehensively, using no more than 10 main headings.

Headings:
{{SERP_RESULTS}}

Use the following json format: {
  "title": "{{TITLE}}",
  "headings" : [ { "title": "", // Add headings in the form of questions
    "keywords": ["...", "...", "...", "..."], // Add a list of keywords here to help to generate the final content of this title
    "headings": [ // Add sub-headings in the form of questions
      { "title": "", "keywords": ["...", "..."] },
      { "title": "", "keywords": ["...", "..."] }, 
    ... ] 
  } ... ],
  "slug" : "", // Use the main keywords for the slug based on the topic of the post with text normalization and accent stripping
  "seoTitle" : "",
  "seoDescription : ""
}`

const INFORMATIVE_INTRO_PROMPT = 'Compose the introduction for this blog post topic, without using phrases such as, "In this article,..." to introduce the subject.' +
  'Instead, explain the context and/or explain the main problem. If possible, give some facts. Do not describe or introduce the content of the different headings of the outline.' +
  'Do not add a heading. Your responses should be in the markdown format. Do not add the title in the beginning of the introduction.'

const CAPTIVATING_INTO_PROMPT = 'Compose a captivating introduction for this blog post topic, without using phrases such as, "In this article,..." to introduce the subject.' +
  'Instead, focus on creating a hook to capture the reader\'s attention, setting the tone and style, and seamlessly leading the reader into the main content of the article.' +
  'Your introduction should entice readers to continue reading the article and learn more about the subject presented.' +
  ' Do not add a heading. Your responses should be in the markdown format. Do not add the title in the beginning of the introduction.'

// ------------------------------------------------------
// PROMPTS FOR THE AUTO MODE
// ------------------------------------------------------

export function getAutoSystemPrompt (postPrompt : PostPrompt) {
  return 'You are a copywriter with a strong expertise in SEO. I need a detailed blog post in ' + postPrompt.language + ' about the topic: "' + postPrompt.topic + '".'
}

export function getPromptForIntentAudience (postPrompt : PostPrompt) {
  return 'For a post based on the topic : ' + postPrompt.topic + ', describe the ideal audience and intent for this topic.' +
  'Write maximum 3 statements for the audience and also 3 statements for the intent.' +
  'Your response should be only the following object in json format : ' +
  '{"audience" : "", "intent": ""}'
}

export function getPromptForOutline (postPrompt : PostPrompt) {
  const { country, intent, audience, serp_outlines } = postPrompt
  const outline = STRUCTURE_OUTLINE.replaceAll('{{TITLE}}', postPrompt.topic).replaceAll('{{SERP_RESULTS}}', serp_outlines);
  const prompt = outline +
    ' Do not add heading for an introduction, conclusion or to summarize the article. ' +
    (country === null || country === 'none' ? '' : 'Market/country/region :' + country + '.') +
    (audience === null ? '' : 'Audience : ' + audience + '.') +
    (intent === null ? '' : 'Content intent : ' + intent + '.')
  return prompt
}

export function getPromptForMainKeyword () {
  const prompt = 'Give me the most important SEO keyword in a JSON array in which each item matches a word without the stop words.'
  return prompt
}

export function getPromptForIntroduction (postPrompt : PostPrompt) {
  return (!postPrompt.tone) || postPrompt.tone === 'informative' ? INFORMATIVE_INTRO_PROMPT : CAPTIVATING_INTO_PROMPT
}

export function getPromptForHeading (tone : string, title : string, keywords : string[] | null, context : string | null) {
  return tone === 'informative' ? getPromptForInformativeHeading(title, keywords, context) : getPromptForCaptivatingHeading(title, keywords, context)
}

export function getPromptForConclusion () {
  return 'Write a compelling conclusion for this blog post topic without using transitional phrases such as, "In conclusion", "In summary", "In short", "So", "Thus", or any other transitional expressions.' +
  'Focus on summarizing the main points of the post, emphasizing the significance of the topic, and leaving the reader with a lasting impression or a thought-provoking final remark.' +
  'Ensure that your conclusion effectively wraps up the article and reinforces the central message or insights presented in the blog post.' +
  'Do not add a heading. Your responses should be in the markdown format.'
}

export function getSeoSystemPrompt (postPrompt : PostPrompt) {
  return 'You are a SEO expert and you need to optimise an web page. ' +
  'Language : ' + postPrompt.language + '. ' +
  (postPrompt.topic
    ? 'Topic : ' + postPrompt.topic + '. '
    : '') +
  (postPrompt.country
    ? 'Country : ' + postPrompt.country + '. '
    : '') +
  (postPrompt.topic
    ? 'Topic : ' + postPrompt.topic + '. '
    : '') +
  (postPrompt.country && postPrompt.country !== 'none'
    ? 'Country : ' + postPrompt.country + '. '
    : '') +
  (postPrompt.intent
    ? 'Intent : ' + postPrompt.intent + '. '
    : '') +
  (postPrompt.audience
    ? 'Audience : ' + postPrompt.audience + '. '
    : '') +
  (postPrompt.tone
    ? 'Tone : ' + postPrompt.tone + '. '
    : '')
}


function getPromptForInformativeHeading (title : string, keywords : string[] | null, context : string | null) {
  const promptAboutContext = context ? context + ' ' : ''
  const promptAboutKeywords = keywords ? 'Keywords: ' + keywords.join(', ') + '.' : ''
  return promptAboutKeywords + promptAboutContext + ' Write informative content for the heading (without the heading) : "' + title + '". ' +
    'Do not start the first sentence with the heading. Instead, start with a sentence that introduces and provides context for the heading.' +
    'Do not add a conclusion or a summary at the end of your answer. Your response should be in the markdown format. Use **double asterisks** to create bold text to highlight important phrases and entities.'
}

function getPromptForCaptivatingHeading (title : string, keywords : string[] | null, context : string | null) {
  const promptAboutContext = context ? context + ' ' : ''
  const promptAboutKeywords = keywords ? 'Keywords: ' + keywords.join(', ') + '. ' : ' '
  return promptAboutKeywords + promptAboutContext + '\n Write captivating content for the heading (without the heading) : "' + title + '". ' +
  'Provide in-depth information and valuable insights. Use clear and concise language, along with relevant examples or anecdotes, to engage the reader and enhance their understanding. ' +
  'Do not start the first sentence with the heading. Instead, start with a sentence that introduces and provides context for the heading. ' +
  'Do not add a conclusion or a summary at the end of your answer. Your response should be in the markdown format. Use **double asterisks** to create bold text to highlight important phrases and entities.'
}

// ------------------------------------------------------
// PROMPTS FOR THE CUSTOM MODE (based on a template)
// ------------------------------------------------------

export function getCustomSystemPrompt (postPrompt : PostPrompt) {
  // The prompt with the index 0 in the template is the system prompt
  return postPrompt.prompts[0] + '\n' + ' Language: ' + postPrompt.language + '. '
}


export function getPromptForSeoInfo (postPrompt : PostPrompt) {
  return 'For content based on the topic of this conversation, Use the H1 provided in the system prompt. If not, write a new H1. ' +
  'Use the slug provided in the system prompt. If not, write a new slug.' +
  'Write an SEO title and an SEO description for this blog post.' +
  'The SEO title should be no more than 60 characters long.' +
  'The H1 and the title should be different.' +
  'The SEO description should be no more than 155 characters long.' +
  'Use the main keywords for the slug based on the topic of the post. Do not mention the country. Max 3 or 4 keywords, without stop words, and with text normalization and accent stripping.' +
  'Your response should be in the JSON format based on the following structure: ' +
  '{"h1" : "", "seoTitle": "", "": "seoDescription": "", "slug": ""}'
}
