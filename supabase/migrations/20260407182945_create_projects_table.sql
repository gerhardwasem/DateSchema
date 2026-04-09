/*
  # Create Projects Table

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `name` (text, not null) - Display name of the project
      - `slug` (text, unique, not null) - URL-safe identifier
      - `description` (text) - Project description
      - `color` (text) - Accent color hex code for UI branding
      - `icon` (text) - Lucide icon name for the project
      - `source_catalog` (jsonb, nullable) - Raw imported JSON catalog
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `projects` table
    - Add policy for anon users to read all projects (public workbench)
    - Add policy for anon users to insert projects
    - Add policy for anon users to update projects
    - Add policy for anon users to delete projects
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  color text DEFAULT '#0891b2',
  icon text DEFAULT 'Hexagon',
  source_catalog jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to projects"
  ON projects FOR SELECT
  TO anon
  USING (id IS NOT NULL);

CREATE POLICY "Allow insert projects"
  ON projects FOR INSERT
  TO anon
  WITH CHECK (name IS NOT NULL AND slug IS NOT NULL);

CREATE POLICY "Allow update projects"
  ON projects FOR UPDATE
  TO anon
  USING (id IS NOT NULL)
  WITH CHECK (id IS NOT NULL);

CREATE POLICY "Allow delete projects"
  ON projects FOR DELETE
  TO anon
  USING (id IS NOT NULL);
