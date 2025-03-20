import { supabaseAdmin } from '../supabase';

/**
 * This migration adds a constructor_args column to the contract_deployments table
 * to store the constructor arguments used for contract verification
 */
async function migrate() {
  console.log('Running migration: Add constructor_args to contract_deployments');
  
  try {
    // Check if the column already exists
    const { data: columns, error: columnsError } = await supabaseAdmin.rpc(
      'get_table_columns',
      { table_name: 'contract_deployments' }
    );
    
    if (columnsError) {
      // Fall back to manually adding the column
      console.log('Manually adding constructor_args column...');
      const { error } = await supabaseAdmin.rpc(
        'alter_table_add_column',
        {
          table_name: 'contract_deployments',
          column_name: 'constructor_args',
          column_type: 'text'
        }
      );
      
      if (error) {
        throw error;
      }
    } else {
      // Check if the column already exists
      const hasColumn = columns.some((col: any) => col.column_name === 'constructor_args');
      
      if (!hasColumn) {
        console.log('Adding constructor_args column...');
        const { error } = await supabaseAdmin.rpc(
          'alter_table_add_column',
          {
            table_name: 'contract_deployments',
            column_name: 'constructor_args',
            column_type: 'text'
          }
        );
        
        if (error) {
          throw error;
        }
      } else {
        console.log('constructor_args column already exists');
      }
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrate();