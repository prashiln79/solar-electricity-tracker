/**
 * SQLite schema for Money Manager.
 * All tables include sync_status for offline-first sync support.
 */

export const CREATE_TABLES_SQL = `
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    uid TEXT PRIMARY KEY NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'free',
    first_name TEXT,
    last_name TEXT,
    display_name TEXT,
    phone TEXT,
    date_of_birth INTEGER,
    occupation TEXT,
    monthly_income REAL,
    photo_url TEXT,
    email_verified INTEGER DEFAULT 0,
    phone_number TEXT,
    provider_id TEXT,
    profile_picture TEXT,
    fcm_token TEXT,
    preferences TEXT,
    login_count INTEGER DEFAULT 0,
    last_login_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER
  );

  -- Accounts table
  CREATE TABLE IF NOT EXISTS accounts (
    account_id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'bank',
    balance REAL NOT NULL DEFAULT 0,
    description TEXT,
    account_number TEXT,
    institution TEXT,
    currency TEXT DEFAULT 'INR',
    is_active INTEGER DEFAULT 1,
    icon TEXT,
    color TEXT,
    family_id TEXT NOT NULL DEFAULT '',
    loan_details TEXT,
    sync_status TEXT DEFAULT 'pending',
    last_sync_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER
  );

  CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);
  CREATE INDEX IF NOT EXISTS idx_accounts_family ON accounts(family_id);

  -- Categories table
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '📦',
    color TEXT NOT NULL DEFAULT '#6366f1',
    parent_category_id TEXT,
    is_sub_category INTEGER DEFAULT 0,
    sub_categories TEXT,
    category_group TEXT,
    group_icon TEXT,
    is_system INTEGER DEFAULT 0,
    budget TEXT,
    family_id TEXT NOT NULL DEFAULT '',
    sync_status TEXT DEFAULT 'pending',
    last_sync_at INTEGER,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
  CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
  CREATE INDEX IF NOT EXISTS idx_categories_family ON categories(family_id);

  -- Transactions table
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    account_id TEXT,
    category_id TEXT NOT NULL,
    category TEXT NOT NULL,
    payee TEXT,
    amount REAL NOT NULL,
    type TEXT NOT NULL,
    date INTEGER NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'completed',

    tags TEXT,
    is_split_transaction INTEGER DEFAULT 0,
    split_group_id TEXT,
    from_account_id TEXT,
    to_account_id TEXT,

    -- Recurrence
    is_recurring INTEGER DEFAULT 0,
    recurring_interval TEXT,
    recurring_end_date INTEGER,
    next_occurrence INTEGER,

    -- Family
    family_id TEXT NOT NULL DEFAULT '',
    user_display_name TEXT,
    user_photo_url TEXT,
    split_data TEXT,

    -- Category split
    is_category_split INTEGER DEFAULT 0,
    category_splits TEXT,
    total_split_amount REAL,

    -- Tax
    tax_amount REAL,
    tax_percentage REAL,
    taxes TEXT,

    -- Sync
    sync_status TEXT DEFAULT 'pending',
    is_pending INTEGER DEFAULT 0,
    last_synced_at INTEGER,

    -- Settlement link
    settlement_id TEXT,
    settlement_family_id TEXT,
    settlement_from_user_id TEXT,
    settlement_to_user_id TEXT,

    -- Flagging
    flagged INTEGER DEFAULT 0,
    flag_message TEXT,
    flagged_by TEXT,
    flagged_at INTEGER,

    -- Location
    place_name TEXT,

    -- Audit
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    created_by TEXT NOT NULL,
    updated_by TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_txn_user ON transactions(user_id);
  CREATE INDEX IF NOT EXISTS idx_txn_date ON transactions(date);
  CREATE INDEX IF NOT EXISTS idx_txn_type ON transactions(type);
  CREATE INDEX IF NOT EXISTS idx_txn_category ON transactions(category_id);
  CREATE INDEX IF NOT EXISTS idx_txn_account ON transactions(account_id);
  CREATE INDEX IF NOT EXISTS idx_txn_family ON transactions(family_id);
  CREATE INDEX IF NOT EXISTS idx_txn_sync ON transactions(sync_status);
  CREATE INDEX IF NOT EXISTS idx_txn_status ON transactions(status);

  -- Budgets table
  CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    amount REAL NOT NULL,
    period TEXT NOT NULL DEFAULT 'monthly',
    category_ids TEXT NOT NULL DEFAULT '[]',
    start_date INTEGER NOT NULL,
    end_date INTEGER,
    is_active INTEGER DEFAULT 1,

    spent_amount REAL DEFAULT 0,
    remaining_amount REAL DEFAULT 0,
    progress_percentage REAL DEFAULT 0,

    alert_threshold REAL DEFAULT 80,
    is_alert_enabled INTEGER DEFAULT 1,

    sync_status TEXT DEFAULT 'pending',
    last_synced_at INTEGER,

    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    created_by TEXT NOT NULL,
    updated_by TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id);
  CREATE INDEX IF NOT EXISTS idx_budgets_active ON budgets(is_active);

  -- Goals table
  CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'savings',
    target_amount REAL NOT NULL,
    current_amount REAL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',

    start_date INTEGER NOT NULL,
    target_date INTEGER,
    completed_date INTEGER,

    progress_percentage REAL DEFAULT 0,
    remaining_amount REAL DEFAULT 0,
    days_remaining INTEGER,
    is_on_track INTEGER DEFAULT 1,

    monthly_contribution REAL,
    contribution_frequency TEXT DEFAULT 'monthly',
    auto_contribution INTEGER DEFAULT 0,
    contribution_account_id TEXT,

    milestones TEXT DEFAULT '[]',

    alert_threshold REAL DEFAULT 80,
    is_alert_enabled INTEGER DEFAULT 1,

    sync_status TEXT DEFAULT 'pending',
    last_synced_at INTEGER,

    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    created_by TEXT NOT NULL,
    updated_by TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
  CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);

  -- Recurring Templates table
  CREATE TABLE IF NOT EXISTS recurring_templates (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    account_id TEXT,
    category_id TEXT NOT NULL,
    category TEXT NOT NULL,
    payee TEXT,
    amount REAL NOT NULL,
    type TEXT NOT NULL,
    category_type TEXT NOT NULL,
    recurring_interval TEXT NOT NULL,
    recurring_end_date INTEGER,
    next_occurrence INTEGER NOT NULL,
    notes TEXT,
    tags TEXT,
    is_active INTEGER DEFAULT 1,
    is_recurring INTEGER DEFAULT 1,
    last_processed_at INTEGER,
    family_id TEXT,
    sync_status TEXT DEFAULT 'pending',

    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    created_by TEXT NOT NULL,
    updated_by TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_recurring_user ON recurring_templates(user_id);
  CREATE INDEX IF NOT EXISTS idx_recurring_active ON recurring_templates(is_active);
  CREATE INDEX IF NOT EXISTS idx_recurring_next ON recurring_templates(next_occurrence);

  -- Families table
  CREATE TABLE IF NOT EXISTS families (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    owner_user_id TEXT NOT NULL,
    invite_code TEXT NOT NULL,
    mode TEXT DEFAULT 'common',
    icon TEXT,
    banner TEXT,
    is_active INTEGER DEFAULT 1,
    member_ids TEXT DEFAULT '[]',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_families_owner ON families(owner_user_id);
  CREATE INDEX IF NOT EXISTS idx_families_invite ON families(invite_code);

  -- Family Members table
  CREATE TABLE IF NOT EXISTS family_members (
    id TEXT PRIMARY KEY NOT NULL,
    family_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    display_name TEXT NOT NULL,
    photo_url TEXT,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1,

    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_fmembers_family ON family_members(family_id);
  CREATE INDEX IF NOT EXISTS idx_fmembers_user ON family_members(user_id);

  -- Settlements table
  CREATE TABLE IF NOT EXISTS settlements (
    id TEXT PRIMARY KEY NOT NULL,
    family_id TEXT NOT NULL,
    from_user_id TEXT NOT NULL,
    from_display_name TEXT NOT NULL,
    from_photo_url TEXT,
    to_user_id TEXT NOT NULL,
    to_display_name TEXT NOT NULL,
    to_photo_url TEXT,
    amount REAL NOT NULL,
    method TEXT NOT NULL DEFAULT 'cash',
    note TEXT,
    settled_at INTEGER NOT NULL,
    linked_transaction_id TEXT,
    created_at INTEGER NOT NULL,

    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_settlements_family ON settlements(family_id);

  -- Sync Queue table (offline operations)
  CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    data TEXT NOT NULL,
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_syncq_type ON sync_queue(entity_type);
`;
