import 'dotenv/config';
import fs from 'fs';
import OpenAI from 'openai';
import promptSync from 'prompt-sync';

const prompt = promptSync();

const openai =  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function main() {
    const stream = await openai.chat.completions.create({
        messages: [{ role: 'user', content: 'Tell me a joke' }],
        model: 'gpt-3.5-turbo',
        stream: true
    });
  
    for await (const part of stream) {
        process.stdout.write(part.choices[0]?.delta?.content || '');
    }
}

async function uploadFile() {
    const fileName = prompt(`Please enter the file path: `);
    let file;

    try {
        file = await openai.files.create({ 
            file: fs.createReadStream(fileName), 
            purpose: 'fine-tune' 
        });
        console.log(`File uploaded: `, file);
        return file;
    } catch(error) {
        console.log(`Error uploading file: ${error}`)
    }
}

async function fineTune(file) {
    try {
        return await openai.fineTunes.create({
            training_file: file.id,
            model: 'gpt-3.5-turbo-0613'
        })
    } catch(error) {
        console.log(`Error creating finetune job: ${error}`);
    }
}

async function showFineTuneList() {
    try {
        const list = await openai.fineTunes.list();
        console.log(list);
        console.table(list.data, ["id", "status", "fine_tuned_model"]);
    } catch(error) {
        console.log(`Error fetching fine-tune list: `,error);
    }
}

async function run() {
    const file = await uploadFile();
    console.log(`File uploaded with details: `, file);
    const ft = await fineTune(file);

    console.log(`Finetune job: `, ft);
}

// run();
// showFineTuneList();
uploadFile();