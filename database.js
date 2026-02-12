const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials missing. App will logic locally unless configured.');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// Create a new block
async function createBlock(blockData) {
    const { data, error } = await supabase
        .from('blocks')
        .insert([blockData])
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Get all blocks
async function getAllBlocks() {
    const { data, error } = await supabase
        .from('blocks')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

// Get a single block by ID
async function getBlockById(id) {
    const { data, error } = await supabase
        .from('blocks')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
    }
    return data;
}

// Update a block
async function updateBlock(id, blockData) {
    const { data, error } = await supabase
        .from('blocks')
        .update(blockData)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return { id, ...data };
}

// Delete a block
async function deleteBlock(id) {
    const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return { id, success: true };
}

// Search blocks by code or material
async function searchBlocks(query) {
    const { data, error } = await supabase
        .from('blocks')
        .select('*')
        .or(`code.ilike.%${query}%,material.ilike.%${query}%`)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

module.exports = {
    createBlock,
    getAllBlocks,
    getBlockById,
    updateBlock,
    deleteBlock,
    searchBlocks
};
