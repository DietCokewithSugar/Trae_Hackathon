import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import csv from 'csv-parser';
import dotenv from 'dotenv';

// 从环境变量读取Supabase配置
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importWords() {
  console.log('Starting to import words from ecdict.csv...');
  
  const words = [];
  let count = 0;
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('ecdict.csv')
      .pipe(csv())
      .on('data', (row) => {
        // 处理CSV行数据
        const wordData = {
          word: row.word || '',
          phonetic: row.phonetic || null,
          definition: row.definition || null,
          translation: row.translation || null,
          pos: row.pos || null,
          collins: row.collins ? parseInt(row.collins) : null,
          oxford: row.oxford ? parseInt(row.oxford) : null,
          tag: row.tag || null,
          bnc: row.bnc ? parseInt(row.bnc) : null,
          frq: row.frq ? parseInt(row.frq) : null,
          exchange: row.exchange || null,
          detail: row.detail || null,
          audio: row.audio || null
        };
        
        words.push(wordData);
        count++;
        
        // 批量插入，每1000条记录插入一次
        if (words.length >= 1000) {
          insertBatch(words.splice(0, 1000));
        }
        
        if (count % 5000 === 0) {
          console.log(`Processed ${count} words...`);
        }
      })
      .on('end', async () => {
        // 插入剩余的数据
        if (words.length > 0) {
          await insertBatch(words);
        }
        console.log(`Import completed! Total words processed: ${count}`);
        resolve();
      })
      .on('error', (error) => {
        console.error('Error reading CSV file:', error);
        reject(error);
      });
  });
}

async function insertBatch(batch) {
  try {
    const { data, error } = await supabase
      .from('words')
      .insert(batch);
    
    if (error) {
      console.error('Error inserting batch:', error);
      // 尝试逐个插入以找出问题数据
      for (const word of batch) {
        const { error: singleError } = await supabase
          .from('words')
          .insert([word]);
        if (singleError) {
          console.error(`Error inserting word "${word.word}":`, singleError);
        }
      }
    } else {
      console.log(`Successfully inserted batch of ${batch.length} words`);
    }
  } catch (err) {
    console.error('Unexpected error during batch insert:', err);
  }
}

// 运行导入
importWords().catch(console.error);