import { oraPromise } from 'ora'
import { ChatGptHelper, GeneratorHelperInterface } from './lib/post-helpers'

import {
  PostPrompt,
  Post
} from './types'
import { replaceAllPrompts } from './lib/template'

/**
 * Class for generating a post. It need a helper class to generate the post
 * Each helper class must implement the GeneratorHelperInterface
 */
export class PostGenerator {
  private helper : GeneratorHelperInterface
  public constructor (helper : GeneratorHelperInterface) {
    this.helper = helper
  }

  public async generate () : Promise<Post> {
    return this.helper.isCustom() ? await this.customGenerate() : await this.autoGenerate()
  }

  private async customGenerate () : Promise<Post> {
    const promptContents = []

    await oraPromise(
      this.helper.init(),
      {
        text: ' Init the completion parameters ...'
      }
    )

    // We remove the first prompt because it is the system prompt
    this.helper.getPrompt().prompts.shift()
    for (const prompt of this.helper.getPrompt().prompts) {
      const content = await oraPromise(
        this.helper.generateCustomPrompt(prompt),
        {
          text: 'Generating post prompt ...'
        }
      )
      promptContents.push(content)
    }

    const content = replaceAllPrompts(this.helper.getPrompt().templateContent, promptContents)

    const seoInfo = await oraPromise(
      this.helper.generateSeoInfo(),
      {
        text: 'Generating SEO info ...'
      }
    )

    return {
      title: this.helper.getPrompt().topic,
      slug: seoInfo.slug,
      seoTitle: seoInfo.seoTitle,
      seoDescription: seoInfo.seoDescription,
      content,
      totalTokens: this.helper.getTotalTokens()
    }
  }

  private async autoGenerate () : Promise<Post> {
    const {topic, enrichOutline} = this.helper.getPrompt();
    await oraPromise(
      this.helper.init(),
      {
        text: ' Init the completion parameters ...'
      }
    )

    const tableOfContent = await oraPromise(
      this.helper.generateContentOutline(),
      {
        text: 'Generating post outline ...'
      }
    )
    const tableOfContentEnriched = await enrichOutline(tableOfContent, topic)

    let content = await oraPromise(
      this.helper.generateIntroduction(),
      {
        text: 'Generating introduction...'
      }
    )

    content += await oraPromise(
      this.helper.generateHeadingContents(tableOfContentEnriched),
      {
        text: 'Generating content ...'
      }
    )

    if (this.helper.getPrompt().withConclusion) {
      content += await oraPromise(
        this.helper.generateConclusion(),
        {
          text: 'Generating conclusion...'
        }
      )
    }

    return {
      title: tableOfContentEnriched.title,
      slug: tableOfContentEnriched.slug,
      seoTitle: tableOfContentEnriched.seoTitle,
      seoDescription: tableOfContentEnriched.seoDescription,
      content,
      totalTokens: this.helper.getTotalTokens()
    }
  }
}

/**
 * Class for generating a post using the OpenAI API
 */
export class OpenAIPostGenerator extends PostGenerator {
  public constructor (postPrompt : PostPrompt) {
    super(new ChatGptHelper(postPrompt))
  }
}
