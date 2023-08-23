import { OpenAI, type OpenAIInput } from 'langchain/llms/openai';
import { PromptTemplate, type PromptTemplateInput } from 'langchain/prompts';
import { LLMChain, type LLMChainInput } from 'langchain/chains';

const openAIInput: Partial<OpenAIInput> = {
    openAIApiKey: process.env.OPENAI_API_KEY
}

const model =  new OpenAI(openAIInput);

const prompt = PromptTemplate.fromTemplate(
    "What is a good name for a company that makes {product}?"
);

const chain = new LLMChain({ llm: model, prompt } as LLMChainInput);

const res = await chain.run("colorful socks");
console.log({ res });