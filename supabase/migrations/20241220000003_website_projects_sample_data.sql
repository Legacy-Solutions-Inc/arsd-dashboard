-- Insert sample data for testing (optional)
INSERT INTO website_projects (name, location) VALUES 
  ('Metro Manila Office Complex', 'Metro Manila, Philippines'),
  ('Cebu Residential Development', 'Cebu City, Philippines'),
  ('Davao Industrial Warehouse', 'Davao City, Philippines')
ON CONFLICT (slug) DO NOTHING;


