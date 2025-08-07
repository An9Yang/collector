import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xhetlcctjefqpjwkjdwc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZXRsY2N0amVmcXBqd2tqZHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NTc3ODAsImV4cCI6MjA2MzUzMzc4MH0.21VBG2WbU6piVcHPAuzOoEmyDTS54dKw5fY3tM08b88';

console.log('Testing Supabase connection...\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  try {
    // Test 1: Check if we can connect to articles table
    console.log('1. Testing articles table...');
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title')
      .limit(1);
    
    if (articlesError) {
      console.error('❌ Articles table error:', articlesError.message);
    } else {
      console.log('✅ Articles table accessible');
      if (articles && articles.length > 0) {
        console.log('   Sample article:', articles[0].title);
      }
    }
    
    // Test 2: Check collections table
    console.log('\n2. Testing collections table...');
    const { data: collections, error: collectionsError } = await supabase
      .from('collections')
      .select('id, name')
      .limit(1);
    
    if (collectionsError) {
      console.error('❌ Collections table error:', collectionsError.message);
    } else {
      console.log('✅ Collections table accessible');
      if (collections && collections.length > 0) {
        console.log('   Sample collection:', collections[0].name);
      }
    }
    
    // Test 3: Count total articles
    console.log('\n3. Counting articles...');
    const { count, error: countError } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Count error:', countError.message);
    } else {
      console.log(`✅ Total articles in database: ${count}`);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testConnection();