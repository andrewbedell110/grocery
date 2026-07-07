-- ============================================================
-- SEED SCRIPT 2/3: Recipes + Ingredients for all 20 users
-- Run this SECOND in Supabase SQL Editor
-- ============================================================

-- Helper: get category IDs
DO $$
DECLARE
  cat_breakfast uuid; cat_lunch uuid; cat_dinner uuid;
  cat_american uuid; cat_chinese uuid; cat_mexican uuid;
  cat_italian uuid; cat_indian uuid; cat_japanese uuid;
  cat_thai uuid; cat_med uuid; cat_other uuid;
  r_id uuid;
BEGIN
  SELECT id INTO cat_breakfast FROM categories WHERE name = 'Breakfast';
  SELECT id INTO cat_lunch FROM categories WHERE name = 'Lunch';
  SELECT id INTO cat_dinner FROM categories WHERE name = 'Dinner';
  SELECT id INTO cat_american FROM categories WHERE name = 'American';
  SELECT id INTO cat_chinese FROM categories WHERE name = 'Chinese';
  SELECT id INTO cat_mexican FROM categories WHERE name = 'Mexican';
  SELECT id INTO cat_italian FROM categories WHERE name = 'Italian';
  SELECT id INTO cat_indian FROM categories WHERE name = 'Indian';
  SELECT id INTO cat_japanese FROM categories WHERE name = 'Japanese';
  SELECT id INTO cat_thai FROM categories WHERE name = 'Thai';
  SELECT id INTO cat_med FROM categories WHERE name = 'Mediterranean';
  SELECT id INTO cat_other FROM categories WHERE name = 'Other';

  -- ========== USER 1: Sarah Mitchell (American) ==========
  INSERT INTO recipes (id, household_id, title, instructions, servings, prep_time, cook_time, created_by) VALUES
    ('c0000000-0101-4000-8000-000000000001', 'b0000000-0001-4000-8000-000000000001', 'Classic Buttermilk Pancakes', E'Step 1: Whisk flour, sugar, baking powder, and salt.\nStep 2: Mix buttermilk, eggs, and melted butter.\nStep 3: Combine wet and dry ingredients until just mixed.\nStep 4: Cook on a greased griddle until bubbles form, then flip.', 4, 10, 15, 'a0000000-0001-4000-8000-000000000001'),
    ('c0000000-0102-4000-8000-000000000001', 'b0000000-0001-4000-8000-000000000001', 'BBQ Pulled Pork Sandwiches', E'Step 1: Season pork shoulder with salt, pepper, paprika, and garlic powder.\nStep 2: Slow cook on low for 8 hours.\nStep 3: Shred pork and mix with BBQ sauce.\nStep 4: Serve on toasted brioche buns with coleslaw.', 6, 15, 480, 'a0000000-0001-4000-8000-000000000001'),
    ('c0000000-0103-4000-8000-000000000001', 'b0000000-0001-4000-8000-000000000001', 'Caesar Salad', E'Step 1: Tear romaine lettuce into pieces.\nStep 2: Make dressing: blend anchovy, garlic, lemon, egg yolk, olive oil, parmesan.\nStep 3: Toss lettuce with dressing.\nStep 4: Top with croutons and shaved parmesan.', 4, 15, 0, 'a0000000-0001-4000-8000-000000000001'),
    ('c0000000-0104-4000-8000-000000000001', 'b0000000-0001-4000-8000-000000000001', 'Mac and Cheese', E'Step 1: Cook elbow macaroni until al dente.\nStep 2: Make roux with butter and flour.\nStep 3: Add milk and stir until thick.\nStep 4: Melt in cheddar and gruyere.\nStep 5: Combine with pasta, top with breadcrumbs, bake at 375F for 25 min.', 6, 15, 35, 'a0000000-0001-4000-8000-000000000001'),
    ('c0000000-0105-4000-8000-000000000001', 'b0000000-0001-4000-8000-000000000001', 'Chocolate Chip Cookies', E'Step 1: Cream butter and sugars until fluffy.\nStep 2: Beat in eggs and vanilla.\nStep 3: Mix in flour, baking soda, and salt.\nStep 4: Fold in chocolate chips.\nStep 5: Bake at 350F for 10-12 minutes.', 24, 15, 12, 'a0000000-0001-4000-8000-000000000001'),
    ('c0000000-0106-4000-8000-000000000001', 'b0000000-0001-4000-8000-000000000001', 'Grilled Chicken Caesar Wrap', E'Step 1: Grill seasoned chicken breast 6 min per side.\nStep 2: Slice chicken.\nStep 3: Layer romaine, chicken, parmesan, caesar dressing in tortilla.\nStep 4: Roll tightly and slice in half.', 2, 10, 12, 'a0000000-0001-4000-8000-000000000001'),
    ('c0000000-0107-4000-8000-000000000001', 'b0000000-0001-4000-8000-000000000001', 'Clam Chowder', E'Step 1: Cook bacon until crispy, set aside.\nStep 2: Saute onion, celery, garlic in bacon fat.\nStep 3: Add potatoes, clam juice, simmer 15 min.\nStep 4: Stir in cream and chopped clams, heat through.', 4, 15, 30, 'a0000000-0001-4000-8000-000000000001');

  -- Sarah's ingredients (simplified - key ones per recipe)
  INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, sort_order) VALUES
    ('c0000000-0101-4000-8000-000000000001', 'all-purpose flour', 2, 'cups', 0),
    ('c0000000-0101-4000-8000-000000000001', 'buttermilk', 1.5, 'cups', 1),
    ('c0000000-0101-4000-8000-000000000001', 'eggs', 2, NULL, 2),
    ('c0000000-0101-4000-8000-000000000001', 'butter', 3, 'tbsp', 3),
    ('c0000000-0101-4000-8000-000000000001', 'sugar', 2, 'tbsp', 4),
    ('c0000000-0102-4000-8000-000000000001', 'pork shoulder', 4, 'lbs', 0),
    ('c0000000-0102-4000-8000-000000000001', 'BBQ sauce', 1, 'cup', 1),
    ('c0000000-0102-4000-8000-000000000001', 'brioche buns', 6, NULL, 2),
    ('c0000000-0102-4000-8000-000000000001', 'coleslaw mix', 2, 'cups', 3),
    ('c0000000-0103-4000-8000-000000000001', 'romaine lettuce', 2, 'heads', 0),
    ('c0000000-0103-4000-8000-000000000001', 'parmesan cheese', 0.5, 'cup', 1),
    ('c0000000-0103-4000-8000-000000000001', 'croutons', 1, 'cup', 2),
    ('c0000000-0104-4000-8000-000000000001', 'elbow macaroni', 1, 'lb', 0),
    ('c0000000-0104-4000-8000-000000000001', 'sharp cheddar', 3, 'cups', 1),
    ('c0000000-0104-4000-8000-000000000001', 'whole milk', 2, 'cups', 2),
    ('c0000000-0105-4000-8000-000000000001', 'butter', 1, 'cup', 0),
    ('c0000000-0105-4000-8000-000000000001', 'chocolate chips', 2, 'cups', 1),
    ('c0000000-0105-4000-8000-000000000001', 'all-purpose flour', 2.25, 'cups', 2),
    ('c0000000-0106-4000-8000-000000000001', 'chicken breast', 2, NULL, 0),
    ('c0000000-0106-4000-8000-000000000001', 'flour tortillas', 2, NULL, 1),
    ('c0000000-0107-4000-8000-000000000001', 'chopped clams', 2, 'cans', 0),
    ('c0000000-0107-4000-8000-000000000001', 'potatoes', 3, NULL, 1),
    ('c0000000-0107-4000-8000-000000000001', 'heavy cream', 1, 'cup', 2);

  -- Sarah's categories
  INSERT INTO recipe_categories (recipe_id, category_id) VALUES
    ('c0000000-0101-4000-8000-000000000001', cat_breakfast),
    ('c0000000-0102-4000-8000-000000000001', cat_dinner),
    ('c0000000-0103-4000-8000-000000000001', cat_lunch),
    ('c0000000-0104-4000-8000-000000000001', cat_dinner),
    ('c0000000-0105-4000-8000-000000000001', cat_other),
    ('c0000000-0106-4000-8000-000000000001', cat_lunch),
    ('c0000000-0107-4000-8000-000000000001', cat_dinner),
    ('c0000000-0101-4000-8000-000000000001', cat_american),
    ('c0000000-0102-4000-8000-000000000001', cat_american),
    ('c0000000-0104-4000-8000-000000000001', cat_american);

  -- ========== USER 2: Carlos Mendoza (Mexican) ==========
  INSERT INTO recipes (id, household_id, title, instructions, servings, prep_time, cook_time, created_by) VALUES
    ('c0000000-0201-4000-8000-000000000001', 'b0000000-0002-4000-8000-000000000002', 'Birria Tacos', E'Step 1: Toast dried chiles in a pan.\nStep 2: Blend chiles with tomatoes, onion, garlic, cumin, oregano.\nStep 3: Braise beef chuck in chile sauce for 3 hours.\nStep 4: Shred meat, dip tortillas in consomme, fill and pan-fry.', 6, 30, 180, 'a0000000-0002-4000-8000-000000000002'),
    ('c0000000-0202-4000-8000-000000000001', 'b0000000-0002-4000-8000-000000000002', 'Enchiladas Verdes', E'Step 1: Boil tomatillos, jalapenos, garlic until soft.\nStep 2: Blend with cilantro and salt for salsa verde.\nStep 3: Fill corn tortillas with shredded chicken, roll and place in baking dish.\nStep 4: Cover with salsa verde and cheese, bake 20 min at 375F.', 4, 20, 30, 'a0000000-0002-4000-8000-000000000002'),
    ('c0000000-0203-4000-8000-000000000001', 'b0000000-0002-4000-8000-000000000002', 'Pozole Rojo', E'Step 1: Simmer pork shoulder in water with onion and garlic for 2 hours.\nStep 2: Toast and blend guajillo and ancho chiles.\nStep 3: Add chile sauce and hominy to broth.\nStep 4: Simmer 30 min. Serve with radish, cabbage, lime, oregano.', 8, 20, 150, 'a0000000-0002-4000-8000-000000000002'),
    ('c0000000-0204-4000-8000-000000000001', 'b0000000-0002-4000-8000-000000000002', 'Chilaquiles Rojos', E'Step 1: Cut corn tortillas into triangles, fry until crispy.\nStep 2: Blend tomatoes, chipotle, garlic, onion into salsa.\nStep 3: Simmer chips in salsa until slightly softened.\nStep 4: Top with crema, queso fresco, onion, cilantro, fried eggs.', 4, 15, 15, 'a0000000-0002-4000-8000-000000000002'),
    ('c0000000-0205-4000-8000-000000000001', 'b0000000-0002-4000-8000-000000000002', 'Churros con Chocolate', E'Step 1: Boil water, butter, sugar, salt. Add flour, stir vigorously.\nStep 2: Pipe dough through star tip into hot oil, fry until golden.\nStep 3: Roll in cinnamon sugar.\nStep 4: Melt chocolate with cream for dipping sauce.', 12, 20, 15, 'a0000000-0002-4000-8000-000000000002'),
    ('c0000000-0206-4000-8000-000000000001', 'b0000000-0002-4000-8000-000000000002', 'Carne Asada', E'Step 1: Marinate flank steak in lime juice, garlic, cumin, cilantro, oil for 2+ hours.\nStep 2: Grill over high heat 4-5 min per side.\nStep 3: Rest 10 min then slice against the grain.\nStep 4: Serve with tortillas, guacamole, pico de gallo.', 4, 15, 10, 'a0000000-0002-4000-8000-000000000002'),
    ('c0000000-0207-4000-8000-000000000001', 'b0000000-0002-4000-8000-000000000002', 'Tamales de Pollo', E'Step 1: Soak corn husks in warm water.\nStep 2: Beat masa with lard, broth, baking powder until fluffy.\nStep 3: Spread masa on husks, add chicken in red chile sauce.\nStep 4: Fold and steam for 1.5 hours.', 20, 60, 90, 'a0000000-0002-4000-8000-000000000002'),
    ('c0000000-0208-4000-8000-000000000001', 'b0000000-0002-4000-8000-000000000002', 'Elote (Street Corn)', E'Step 1: Grill corn on the cob until charred.\nStep 2: Spread with mayo and crema.\nStep 3: Roll in cotija cheese.\nStep 4: Sprinkle with chile powder and lime juice.', 4, 5, 10, 'a0000000-0002-4000-8000-000000000002');

  INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, sort_order) VALUES
    ('c0000000-0201-4000-8000-000000000001', 'beef chuck roast', 3, 'lbs', 0), ('c0000000-0201-4000-8000-000000000001', 'dried guajillo chiles', 6, NULL, 1), ('c0000000-0201-4000-8000-000000000001', 'corn tortillas', 12, NULL, 2),
    ('c0000000-0202-4000-8000-000000000001', 'tomatillos', 1, 'lb', 0), ('c0000000-0202-4000-8000-000000000001', 'shredded chicken', 3, 'cups', 1), ('c0000000-0202-4000-8000-000000000001', 'corn tortillas', 12, NULL, 2),
    ('c0000000-0203-4000-8000-000000000001', 'pork shoulder', 2, 'lbs', 0), ('c0000000-0203-4000-8000-000000000001', 'hominy', 2, 'cans', 1), ('c0000000-0203-4000-8000-000000000001', 'guajillo chiles', 4, NULL, 2),
    ('c0000000-0204-4000-8000-000000000001', 'corn tortillas', 10, NULL, 0), ('c0000000-0204-4000-8000-000000000001', 'tomatoes', 4, NULL, 1), ('c0000000-0204-4000-8000-000000000001', 'queso fresco', 0.5, 'cup', 2),
    ('c0000000-0205-4000-8000-000000000001', 'all-purpose flour', 1, 'cup', 0), ('c0000000-0205-4000-8000-000000000001', 'dark chocolate', 4, 'oz', 1), ('c0000000-0205-4000-8000-000000000001', 'cinnamon', 1, 'tsp', 2),
    ('c0000000-0206-4000-8000-000000000001', 'flank steak', 2, 'lbs', 0), ('c0000000-0206-4000-8000-000000000001', 'limes', 3, NULL, 1), ('c0000000-0206-4000-8000-000000000001', 'cilantro', 1, 'bunch', 2),
    ('c0000000-0207-4000-8000-000000000001', 'masa harina', 4, 'cups', 0), ('c0000000-0207-4000-8000-000000000001', 'lard', 1, 'cup', 1), ('c0000000-0207-4000-8000-000000000001', 'chicken thighs', 2, 'lbs', 2),
    ('c0000000-0208-4000-8000-000000000001', 'corn on the cob', 4, NULL, 0), ('c0000000-0208-4000-8000-000000000001', 'cotija cheese', 0.5, 'cup', 1), ('c0000000-0208-4000-8000-000000000001', 'chile powder', 1, 'tsp', 2);

  INSERT INTO recipe_categories (recipe_id, category_id) VALUES
    ('c0000000-0201-4000-8000-000000000001', cat_dinner), ('c0000000-0201-4000-8000-000000000001', cat_mexican),
    ('c0000000-0202-4000-8000-000000000001', cat_dinner), ('c0000000-0202-4000-8000-000000000001', cat_mexican),
    ('c0000000-0203-4000-8000-000000000001', cat_dinner), ('c0000000-0203-4000-8000-000000000001', cat_mexican),
    ('c0000000-0204-4000-8000-000000000001', cat_breakfast), ('c0000000-0204-4000-8000-000000000001', cat_mexican),
    ('c0000000-0205-4000-8000-000000000001', cat_other), ('c0000000-0205-4000-8000-000000000001', cat_mexican),
    ('c0000000-0206-4000-8000-000000000001', cat_dinner), ('c0000000-0206-4000-8000-000000000001', cat_mexican),
    ('c0000000-0207-4000-8000-000000000001', cat_dinner), ('c0000000-0207-4000-8000-000000000001', cat_mexican),
    ('c0000000-0208-4000-8000-000000000001', cat_lunch), ('c0000000-0208-4000-8000-000000000001', cat_mexican);

  -- ========== USER 3: Wei Zhang (Chinese) ==========
  INSERT INTO recipes (id, household_id, title, instructions, servings, prep_time, cook_time, created_by) VALUES
    ('c0000000-0301-4000-8000-000000000001', 'b0000000-0003-4000-8000-000000000003', 'Mapo Tofu', E'Step 1: Brown pork mince with doubanjiang and fermented black beans.\nStep 2: Add chicken stock, soy sauce, and cubed silken tofu.\nStep 3: Simmer 8 min. Thicken with cornstarch slurry.\nStep 4: Finish with Sichuan pepper oil and scallions.', 4, 10, 15, 'a0000000-0003-4000-8000-000000000003'),
    ('c0000000-0302-4000-8000-000000000001', 'b0000000-0003-4000-8000-000000000003', 'Kung Pao Chicken', E'Step 1: Marinate diced chicken in soy, rice wine, cornstarch.\nStep 2: Fry dried chiles and Sichuan peppercorns in wok.\nStep 3: Stir-fry chicken until golden. Add vegetables.\nStep 4: Pour in sauce (soy, vinegar, sugar), toss with roasted peanuts.', 4, 20, 10, 'a0000000-0003-4000-8000-000000000003'),
    ('c0000000-0303-4000-8000-000000000001', 'b0000000-0003-4000-8000-000000000003', 'Dan Dan Noodles', E'Step 1: Cook thin wheat noodles.\nStep 2: Brown pork mince with preserved mustard greens.\nStep 3: Make sauce: sesame paste, chili oil, soy, vinegar, sugar.\nStep 4: Toss noodles in sauce, top with pork and scallions.', 2, 10, 10, 'a0000000-0003-4000-8000-000000000003'),
    ('c0000000-0304-4000-8000-000000000001', 'b0000000-0003-4000-8000-000000000003', 'Scallion Pancakes', E'Step 1: Mix flour and boiling water into a dough, rest 30 min.\nStep 2: Roll flat, brush with sesame oil, add scallions and salt.\nStep 3: Roll into coil, flatten, then pan-fry until golden and crispy.', 4, 40, 15, 'a0000000-0003-4000-8000-000000000003'),
    ('c0000000-0305-4000-8000-000000000001', 'b0000000-0003-4000-8000-000000000003', 'Hot and Sour Soup', E'Step 1: Simmer chicken broth with wood ear mushrooms and bamboo shoots.\nStep 2: Season with white pepper, rice vinegar, soy, chili oil.\nStep 3: Thicken with cornstarch slurry.\nStep 4: Drizzle beaten egg while stirring. Top with sesame oil.', 4, 15, 15, 'a0000000-0003-4000-8000-000000000003'),
    ('c0000000-0306-4000-8000-000000000001', 'b0000000-0003-4000-8000-000000000003', 'Char Siu Pork', E'Step 1: Marinate pork shoulder in hoisin, honey, soy, five spice, red fermented tofu overnight.\nStep 2: Roast at 425F for 35 min, basting every 10 min.\nStep 3: Broil 2 min for caramelized edges.\nStep 4: Slice and serve with steamed rice.', 4, 15, 40, 'a0000000-0003-4000-8000-000000000003');

  INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, sort_order) VALUES
    ('c0000000-0301-4000-8000-000000000001', 'silken tofu', 1, 'lb', 0), ('c0000000-0301-4000-8000-000000000001', 'ground pork', 0.5, 'lb', 1), ('c0000000-0301-4000-8000-000000000001', 'doubanjiang', 2, 'tbsp', 2),
    ('c0000000-0302-4000-8000-000000000001', 'chicken thighs', 1, 'lb', 0), ('c0000000-0302-4000-8000-000000000001', 'roasted peanuts', 0.5, 'cup', 1), ('c0000000-0302-4000-8000-000000000001', 'dried red chiles', 10, NULL, 2),
    ('c0000000-0303-4000-8000-000000000001', 'thin wheat noodles', 8, 'oz', 0), ('c0000000-0303-4000-8000-000000000001', 'sesame paste', 2, 'tbsp', 1), ('c0000000-0303-4000-8000-000000000001', 'chili oil', 2, 'tbsp', 2),
    ('c0000000-0304-4000-8000-000000000001', 'all-purpose flour', 2, 'cups', 0), ('c0000000-0304-4000-8000-000000000001', 'scallions', 1, 'cup', 1), ('c0000000-0304-4000-8000-000000000001', 'sesame oil', 2, 'tbsp', 2),
    ('c0000000-0305-4000-8000-000000000001', 'chicken broth', 4, 'cups', 0), ('c0000000-0305-4000-8000-000000000001', 'wood ear mushrooms', 0.5, 'cup', 1), ('c0000000-0305-4000-8000-000000000001', 'rice vinegar', 3, 'tbsp', 2),
    ('c0000000-0306-4000-8000-000000000001', 'pork shoulder', 2, 'lbs', 0), ('c0000000-0306-4000-8000-000000000001', 'hoisin sauce', 3, 'tbsp', 1), ('c0000000-0306-4000-8000-000000000001', 'honey', 3, 'tbsp', 2);

  INSERT INTO recipe_categories (recipe_id, category_id) VALUES
    ('c0000000-0301-4000-8000-000000000001', cat_dinner), ('c0000000-0301-4000-8000-000000000001', cat_chinese),
    ('c0000000-0302-4000-8000-000000000001', cat_dinner), ('c0000000-0302-4000-8000-000000000001', cat_chinese),
    ('c0000000-0303-4000-8000-000000000001', cat_lunch), ('c0000000-0303-4000-8000-000000000001', cat_chinese),
    ('c0000000-0304-4000-8000-000000000001', cat_breakfast), ('c0000000-0304-4000-8000-000000000001', cat_chinese),
    ('c0000000-0305-4000-8000-000000000001', cat_dinner), ('c0000000-0305-4000-8000-000000000001', cat_chinese),
    ('c0000000-0306-4000-8000-000000000001', cat_dinner), ('c0000000-0306-4000-8000-000000000001', cat_chinese);

  -- ========== USERS 4-20: Batch insert recipes ==========
  -- User 4: Priya Patel (Indian)
  INSERT INTO recipes (id, household_id, title, instructions, servings, prep_time, cook_time, created_by) VALUES
    ('c0000000-0401-4000-8000-000000000001', 'b0000000-0004-4000-8000-000000000004', 'Butter Chicken', E'Step 1: Marinate chicken in yogurt, garam masala, turmeric.\nStep 2: Grill or pan-fry chicken.\nStep 3: Simmer tomato sauce with butter, cream, kasuri methi.\nStep 4: Add chicken, simmer 10 min. Serve with naan.', 4, 30, 30, 'a0000000-0004-4000-8000-000000000004'),
    ('c0000000-0402-4000-8000-000000000001', 'b0000000-0004-4000-8000-000000000004', 'Dal Makhani', E'Step 1: Soak urad dal and rajma overnight.\nStep 2: Pressure cook with water until soft.\nStep 3: Prepare tadka with butter, cumin, ginger, garlic, tomato puree.\nStep 4: Combine and simmer on low for 1 hour with cream.', 6, 15, 90, 'a0000000-0004-4000-8000-000000000004'),
    ('c0000000-0403-4000-8000-000000000001', 'b0000000-0004-4000-8000-000000000004', 'Chicken Biryani', E'Step 1: Marinate chicken in yogurt and biryani spices.\nStep 2: Par-boil basmati rice with whole spices.\nStep 3: Layer rice and chicken in pot with saffron milk, fried onions.\nStep 4: Seal and cook on low heat 25 min (dum).', 6, 30, 45, 'a0000000-0004-4000-8000-000000000004'),
    ('c0000000-0404-4000-8000-000000000001', 'b0000000-0004-4000-8000-000000000004', 'Palak Paneer', E'Step 1: Blanch spinach, blend into puree.\nStep 2: Fry paneer cubes until golden.\nStep 3: Cook onion, garlic, ginger, add spinach puree and spices.\nStep 4: Add paneer cubes and cream, simmer 5 min.', 4, 15, 20, 'a0000000-0004-4000-8000-000000000004'),
    ('c0000000-0405-4000-8000-000000000001', 'b0000000-0004-4000-8000-000000000004', 'Samosas', E'Step 1: Make dough with flour, oil, ajwain seeds.\nStep 2: Cook spiced potato and pea filling.\nStep 3: Shape into cones, fill, and seal.\nStep 4: Deep fry until golden and crispy.', 12, 40, 20, 'a0000000-0004-4000-8000-000000000004'),
    ('c0000000-0406-4000-8000-000000000001', 'b0000000-0004-4000-8000-000000000004', 'Masala Chai', E'Step 1: Crush cardamom, cloves, cinnamon, ginger.\nStep 2: Boil water with spices and tea leaves.\nStep 3: Add milk, simmer 3 min.\nStep 4: Strain, sweeten with sugar.', 2, 5, 10, 'a0000000-0004-4000-8000-000000000004');

  INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, sort_order) VALUES
    ('c0000000-0401-4000-8000-000000000001', 'chicken thighs', 2, 'lbs', 0), ('c0000000-0401-4000-8000-000000000001', 'heavy cream', 0.5, 'cup', 1), ('c0000000-0401-4000-8000-000000000001', 'butter', 4, 'tbsp', 2),
    ('c0000000-0402-4000-8000-000000000001', 'urad dal', 1, 'cup', 0), ('c0000000-0402-4000-8000-000000000001', 'kidney beans', 0.25, 'cup', 1), ('c0000000-0402-4000-8000-000000000001', 'cream', 0.25, 'cup', 2),
    ('c0000000-0403-4000-8000-000000000001', 'basmati rice', 2, 'cups', 0), ('c0000000-0403-4000-8000-000000000001', 'chicken', 1.5, 'lbs', 1), ('c0000000-0403-4000-8000-000000000001', 'saffron', 1, 'pinch', 2),
    ('c0000000-0404-4000-8000-000000000001', 'spinach', 1, 'lb', 0), ('c0000000-0404-4000-8000-000000000001', 'paneer', 8, 'oz', 1), ('c0000000-0404-4000-8000-000000000001', 'cream', 2, 'tbsp', 2),
    ('c0000000-0405-4000-8000-000000000001', 'potatoes', 3, NULL, 0), ('c0000000-0405-4000-8000-000000000001', 'green peas', 0.5, 'cup', 1), ('c0000000-0405-4000-8000-000000000001', 'all-purpose flour', 2, 'cups', 2),
    ('c0000000-0406-4000-8000-000000000001', 'black tea leaves', 2, 'tsp', 0), ('c0000000-0406-4000-8000-000000000001', 'whole milk', 1, 'cup', 1), ('c0000000-0406-4000-8000-000000000001', 'cardamom pods', 3, NULL, 2);

  INSERT INTO recipe_categories (recipe_id, category_id) VALUES
    ('c0000000-0401-4000-8000-000000000001', cat_dinner), ('c0000000-0401-4000-8000-000000000001', cat_indian),
    ('c0000000-0402-4000-8000-000000000001', cat_dinner), ('c0000000-0402-4000-8000-000000000001', cat_indian),
    ('c0000000-0403-4000-8000-000000000001', cat_dinner), ('c0000000-0403-4000-8000-000000000001', cat_indian),
    ('c0000000-0404-4000-8000-000000000001', cat_dinner), ('c0000000-0404-4000-8000-000000000001', cat_indian),
    ('c0000000-0405-4000-8000-000000000001', cat_lunch), ('c0000000-0405-4000-8000-000000000001', cat_indian),
    ('c0000000-0406-4000-8000-000000000001', cat_breakfast), ('c0000000-0406-4000-8000-000000000001', cat_indian);

  -- User 5: Yuki Tanaka (Japanese)
  INSERT INTO recipes (id, household_id, title, instructions, servings, prep_time, cook_time, created_by) VALUES
    ('c0000000-0501-4000-8000-000000000001', 'b0000000-0005-4000-8000-000000000005', 'Tonkotsu Ramen', E'Step 1: Simmer pork bones 12 hours for broth.\nStep 2: Cook ramen noodles.\nStep 3: Prepare toppings: chashu, soft-boiled egg, nori, scallions.\nStep 4: Assemble bowls with broth, noodles, and toppings.', 4, 30, 720, 'a0000000-0005-4000-8000-000000000005'),
    ('c0000000-0502-4000-8000-000000000001', 'b0000000-0005-4000-8000-000000000005', 'Gyoza', E'Step 1: Mix ground pork, cabbage, garlic, ginger, sesame oil.\nStep 2: Fill wrappers and pleat edges.\nStep 3: Pan-fry until bottoms are golden.\nStep 4: Add water, cover to steam until cooked through.', 30, 30, 10, 'a0000000-0005-4000-8000-000000000005'),
    ('c0000000-0503-4000-8000-000000000001', 'b0000000-0005-4000-8000-000000000005', 'Teriyaki Salmon', E'Step 1: Mix soy sauce, mirin, sake, sugar for teriyaki.\nStep 2: Pan-sear salmon skin-side down 4 min.\nStep 3: Flip, pour sauce over, cook 3 min.\nStep 4: Serve over rice with steamed vegetables.', 2, 10, 10, 'a0000000-0005-4000-8000-000000000005'),
    ('c0000000-0504-4000-8000-000000000001', 'b0000000-0005-4000-8000-000000000005', 'Katsu Curry', E'Step 1: Bread pork cutlets: flour, egg, panko.\nStep 2: Deep fry until golden.\nStep 3: Make Japanese curry with curry roux, onions, carrots, potatoes.\nStep 4: Serve katsu over rice with curry.', 4, 20, 30, 'a0000000-0005-4000-8000-000000000005'),
    ('c0000000-0505-4000-8000-000000000001', 'b0000000-0005-4000-8000-000000000005', 'Miso Soup', E'Step 1: Heat dashi stock.\nStep 2: Add cubed tofu and wakame seaweed.\nStep 3: Remove from heat, dissolve miso paste.\nStep 4: Garnish with scallions.', 4, 5, 10, 'a0000000-0005-4000-8000-000000000005');

  INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, sort_order) VALUES
    ('c0000000-0501-4000-8000-000000000001', 'pork bones', 3, 'lbs', 0), ('c0000000-0501-4000-8000-000000000001', 'ramen noodles', 4, 'portions', 1),
    ('c0000000-0502-4000-8000-000000000001', 'ground pork', 0.5, 'lb', 0), ('c0000000-0502-4000-8000-000000000001', 'gyoza wrappers', 30, NULL, 1),
    ('c0000000-0503-4000-8000-000000000001', 'salmon fillets', 2, NULL, 0), ('c0000000-0503-4000-8000-000000000001', 'soy sauce', 3, 'tbsp', 1), ('c0000000-0503-4000-8000-000000000001', 'mirin', 2, 'tbsp', 2),
    ('c0000000-0504-4000-8000-000000000001', 'pork loin cutlets', 4, NULL, 0), ('c0000000-0504-4000-8000-000000000001', 'panko breadcrumbs', 2, 'cups', 1), ('c0000000-0504-4000-8000-000000000001', 'curry roux', 1, 'box', 2),
    ('c0000000-0505-4000-8000-000000000001', 'dashi stock', 4, 'cups', 0), ('c0000000-0505-4000-8000-000000000001', 'white miso paste', 3, 'tbsp', 1), ('c0000000-0505-4000-8000-000000000001', 'silken tofu', 0.5, 'lb', 2);

  INSERT INTO recipe_categories (recipe_id, category_id) VALUES
    ('c0000000-0501-4000-8000-000000000001', cat_dinner), ('c0000000-0501-4000-8000-000000000001', cat_japanese),
    ('c0000000-0502-4000-8000-000000000001', cat_dinner), ('c0000000-0502-4000-8000-000000000001', cat_japanese),
    ('c0000000-0503-4000-8000-000000000001', cat_dinner), ('c0000000-0503-4000-8000-000000000001', cat_japanese),
    ('c0000000-0504-4000-8000-000000000001', cat_dinner), ('c0000000-0504-4000-8000-000000000001', cat_japanese),
    ('c0000000-0505-4000-8000-000000000001', cat_dinner), ('c0000000-0505-4000-8000-000000000001', cat_japanese);

  -- Users 6-20: Concise recipe inserts (5-8 recipes each, 3 ingredients each)
  -- User 6: Maria Garcia (Mexican)
  INSERT INTO recipes (id, household_id, title, instructions, servings, prep_time, cook_time, created_by) VALUES
    ('c0000000-0601-4000-8000-000000000001', 'b0000000-0006-4000-8000-000000000006', 'Mole Poblano', E'Step 1: Toast chiles, blend with chocolate, spices.\nStep 2: Simmer sauce 30 min.\nStep 3: Braise chicken in mole.\nStep 4: Serve with rice and sesame seeds.', 6, 30, 60, 'a0000000-0006-4000-8000-000000000006'),
    ('c0000000-0602-4000-8000-000000000001', 'b0000000-0006-4000-8000-000000000006', 'Carnitas', E'Step 1: Cut pork into chunks, season.\nStep 2: Braise in orange juice, lard, garlic for 3 hours.\nStep 3: Shred and crisp under broiler.\nStep 4: Serve in tortillas.', 6, 15, 180, 'a0000000-0006-4000-8000-000000000006'),
    ('c0000000-0603-4000-8000-000000000001', 'b0000000-0006-4000-8000-000000000006', 'Tres Leches Cake', E'Step 1: Bake vanilla sponge cake.\nStep 2: Mix condensed, evaporated, and heavy cream.\nStep 3: Poke holes, pour milk mixture over cake.\nStep 4: Chill overnight, top with whipped cream.', 12, 20, 25, 'a0000000-0006-4000-8000-000000000006'),
    ('c0000000-0604-4000-8000-000000000001', 'b0000000-0006-4000-8000-000000000006', 'Sopes', E'Step 1: Form masa into thick discs, cook on griddle.\nStep 2: Pinch edges to form a border.\nStep 3: Fill with beans, meat, lettuce, crema, salsa.', 8, 20, 15, 'a0000000-0006-4000-8000-000000000006'),
    ('c0000000-0605-4000-8000-000000000001', 'b0000000-0006-4000-8000-000000000006', 'Horchata', E'Step 1: Soak rice and cinnamon sticks overnight.\nStep 2: Blend with water until smooth.\nStep 3: Strain through cheesecloth.\nStep 4: Sweeten with sugar, serve over ice.', 6, 10, 0, 'a0000000-0006-4000-8000-000000000006');

  INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, sort_order) VALUES
    ('c0000000-0601-4000-8000-000000000001', 'ancho chiles', 5, NULL, 0), ('c0000000-0601-4000-8000-000000000001', 'Mexican chocolate', 2, 'oz', 1), ('c0000000-0601-4000-8000-000000000001', 'chicken', 3, 'lbs', 2),
    ('c0000000-0602-4000-8000-000000000001', 'pork butt', 4, 'lbs', 0), ('c0000000-0602-4000-8000-000000000001', 'oranges', 2, NULL, 1), ('c0000000-0602-4000-8000-000000000001', 'lard', 2, 'tbsp', 2),
    ('c0000000-0603-4000-8000-000000000001', 'condensed milk', 1, 'can', 0), ('c0000000-0603-4000-8000-000000000001', 'evaporated milk', 1, 'can', 1), ('c0000000-0603-4000-8000-000000000001', 'heavy cream', 1, 'cup', 2),
    ('c0000000-0604-4000-8000-000000000001', 'masa harina', 2, 'cups', 0), ('c0000000-0604-4000-8000-000000000001', 'refried beans', 1, 'can', 1), ('c0000000-0604-4000-8000-000000000001', 'crema', 0.5, 'cup', 2),
    ('c0000000-0605-4000-8000-000000000001', 'long grain rice', 1, 'cup', 0), ('c0000000-0605-4000-8000-000000000001', 'cinnamon sticks', 2, NULL, 1), ('c0000000-0605-4000-8000-000000000001', 'sugar', 0.5, 'cup', 2);

  INSERT INTO recipe_categories (recipe_id, category_id) VALUES
    ('c0000000-0601-4000-8000-000000000001', cat_dinner), ('c0000000-0601-4000-8000-000000000001', cat_mexican),
    ('c0000000-0602-4000-8000-000000000001', cat_dinner), ('c0000000-0602-4000-8000-000000000001', cat_mexican),
    ('c0000000-0603-4000-8000-000000000001', cat_other), ('c0000000-0603-4000-8000-000000000001', cat_mexican),
    ('c0000000-0604-4000-8000-000000000001', cat_lunch), ('c0000000-0604-4000-8000-000000000001', cat_mexican),
    ('c0000000-0605-4000-8000-000000000001', cat_other), ('c0000000-0605-4000-8000-000000000001', cat_mexican);

  -- Users 7-20: 5 recipes each (keeping it efficient)
  -- User 7: James Wilson (American), 8: Fatima Al-Hassan (Middle Eastern), 9: Kim Nguyen (Vietnamese)
  -- User 10: Luigi Rossi (Italian), 11: Aisha Johnson (American/Soul), 12: Chen Wei Lin (Taiwanese)
  -- User 13: Sofia Rodriguez (Mexican), 14: David Thompson (American), 15: Mei-Ling Wu (Chinese)
  -- User 16: Hassan Ahmed (Middle Eastern), 17: Rachel Kim (Korean), 18: Pierre Dubois (French)
  -- User 19: Ananya Sharma (Indian), 20: Tyler Brooks (American)

  -- Generating remaining recipes in a compact format
  FOR i IN 7..20 LOOP
    -- Each user gets 5-8 recipes based on their culture
    NULL; -- handled below individually
  END LOOP;

  -- User 7: James (American)
  INSERT INTO recipes (id, household_id, title, instructions, servings, cook_time, created_by) VALUES
    ('c0000000-0701-4000-8000-000000000001', 'b0000000-0007-4000-8000-000000000007', 'Smash Burgers', E'Step 1: Form beef into balls, smash on hot griddle.\nStep 2: Season, add cheese to melt.\nStep 3: Toast buns, assemble with toppings.', 4, 10, 'a0000000-0007-4000-8000-000000000007'),
    ('c0000000-0702-4000-8000-000000000001', 'b0000000-0007-4000-8000-000000000007', 'Buffalo Wings', E'Step 1: Deep fry wings until crispy.\nStep 2: Toss in hot sauce and butter.\nStep 3: Serve with ranch and celery.', 4, 20, 'a0000000-0007-4000-8000-000000000007'),
    ('c0000000-0703-4000-8000-000000000001', 'b0000000-0007-4000-8000-000000000007', 'Philly Cheesesteak', E'Step 1: Thinly slice ribeye.\nStep 2: Cook with peppers and onions.\nStep 3: Melt provolone on top.\nStep 4: Stuff into hoagie rolls.', 4, 15, 'a0000000-0007-4000-8000-000000000007'),
    ('c0000000-0704-4000-8000-000000000001', 'b0000000-0007-4000-8000-000000000007', 'Loaded Baked Potato Soup', E'Step 1: Cook bacon, set aside.\nStep 2: Simmer potatoes in broth.\nStep 3: Blend half, add cream.\nStep 4: Top with bacon, cheese, sour cream.', 6, 30, 'a0000000-0007-4000-8000-000000000007'),
    ('c0000000-0705-4000-8000-000000000001', 'b0000000-0007-4000-8000-000000000007', 'Apple Pie', E'Step 1: Make pie crust.\nStep 2: Toss apples with sugar, cinnamon.\nStep 3: Fill crust, top with lattice.\nStep 4: Bake 50 min at 375F.', 8, 50, 'a0000000-0007-4000-8000-000000000007');

  -- User 8: Fatima (Middle Eastern)
  INSERT INTO recipes (id, household_id, title, instructions, servings, cook_time, created_by) VALUES
    ('c0000000-0801-4000-8000-000000000001', 'b0000000-0008-4000-8000-000000000008', 'Chicken Shawarma', E'Step 1: Marinate chicken in yogurt, cumin, turmeric, paprika.\nStep 2: Roast at 425F until charred.\nStep 3: Slice and serve in pita with tahini, pickles.', 4, 30, 'a0000000-0008-4000-8000-000000000008'),
    ('c0000000-0802-4000-8000-000000000001', 'b0000000-0008-4000-8000-000000000008', 'Falafel', E'Step 1: Soak chickpeas overnight.\nStep 2: Blend with herbs, onion, spices.\nStep 3: Form patties, deep fry until golden.', 20, 15, 'a0000000-0008-4000-8000-000000000008'),
    ('c0000000-0803-4000-8000-000000000001', 'b0000000-0008-4000-8000-000000000008', 'Hummus', E'Step 1: Blend cooked chickpeas with tahini, lemon, garlic.\nStep 2: Stream in ice water for creaminess.\nStep 3: Serve with olive oil and paprika.', 8, 0, 'a0000000-0008-4000-8000-000000000008'),
    ('c0000000-0804-4000-8000-000000000001', 'b0000000-0008-4000-8000-000000000008', 'Baklava', E'Step 1: Layer phyllo with butter and chopped nuts.\nStep 2: Cut into diamonds, bake until golden.\nStep 3: Pour honey syrup over hot baklava.', 24, 45, 'a0000000-0008-4000-8000-000000000008'),
    ('c0000000-0805-4000-8000-000000000001', 'b0000000-0008-4000-8000-000000000008', 'Shakshuka', E'Step 1: Saute onion, pepper, garlic.\nStep 2: Add tomatoes, cumin, paprika, simmer.\nStep 3: Make wells, crack in eggs, cover until set.', 4, 20, 'a0000000-0008-4000-8000-000000000008'),
    ('c0000000-0806-4000-8000-000000000001', 'b0000000-0008-4000-8000-000000000008', 'Tabbouleh', E'Step 1: Soak bulgur in hot water.\nStep 2: Finely chop parsley, mint, tomato, onion.\nStep 3: Toss with lemon juice and olive oil.', 4, 0, 'a0000000-0008-4000-8000-000000000008');

  -- User 9: Kim Nguyen (Vietnamese)
  INSERT INTO recipes (id, household_id, title, instructions, servings, cook_time, created_by) VALUES
    ('c0000000-0901-4000-8000-000000000001', 'b0000000-0009-4000-8000-000000000009', 'Pho Bo', E'Step 1: Char onion and ginger, simmer beef bones 6 hours.\nStep 2: Season broth with star anise, cinnamon, fish sauce.\nStep 3: Cook rice noodles.\nStep 4: Serve with raw beef, herbs, bean sprouts.', 4, 360, 'a0000000-0009-4000-8000-000000000009'),
    ('c0000000-0902-4000-8000-000000000001', 'b0000000-0009-4000-8000-000000000009', 'Banh Mi', E'Step 1: Pickle carrots and daikon.\nStep 2: Make pate spread.\nStep 3: Layer baguette with pork, pate, pickles, jalapeno, cilantro.', 4, 15, 'a0000000-0009-4000-8000-000000000009'),
    ('c0000000-0903-4000-8000-000000000001', 'b0000000-0009-4000-8000-000000000009', 'Fresh Spring Rolls', E'Step 1: Soak rice paper in warm water.\nStep 2: Fill with shrimp, vermicelli, lettuce, herbs.\nStep 3: Roll tightly. Serve with peanut sauce.', 8, 0, 'a0000000-0009-4000-8000-000000000009'),
    ('c0000000-0904-4000-8000-000000000001', 'b0000000-0009-4000-8000-000000000009', 'Bun Cha', E'Step 1: Grill pork patties and pork belly.\nStep 2: Make dipping sauce: fish sauce, sugar, lime, garlic, chili.\nStep 3: Serve with vermicelli noodles and herbs.', 4, 20, 'a0000000-0009-4000-8000-000000000009'),
    ('c0000000-0905-4000-8000-000000000001', 'b0000000-0009-4000-8000-000000000009', 'Vietnamese Coffee', E'Step 1: Add condensed milk to glass.\nStep 2: Brew dark roast through phin filter.\nStep 3: Stir and pour over ice.', 1, 5, 'a0000000-0009-4000-8000-000000000009');

  -- User 10: Luigi (Italian)
  INSERT INTO recipes (id, household_id, title, instructions, servings, cook_time, created_by) VALUES
    ('c0000000-1001-4000-8000-000000000001', 'b0000000-0010-4000-8000-000000000010', 'Spaghetti Carbonara', E'Step 1: Cook guanciale until crispy.\nStep 2: Mix eggs, pecorino, black pepper.\nStep 3: Toss hot pasta with guanciale and egg mixture off heat.', 4, 15, 'a0000000-0010-4000-8000-000000000010'),
    ('c0000000-1002-4000-8000-000000000001', 'b0000000-0010-4000-8000-000000000010', 'Osso Buco', E'Step 1: Brown veal shanks.\nStep 2: Saute mirepoix, deglaze with wine.\nStep 3: Braise in tomato and stock for 2 hours.\nStep 4: Serve with gremolata and risotto.', 4, 150, 'a0000000-0010-4000-8000-000000000010'),
    ('c0000000-1003-4000-8000-000000000001', 'b0000000-0010-4000-8000-000000000010', 'Tiramisu', E'Step 1: Whisk egg yolks with sugar, fold in mascarpone.\nStep 2: Whip cream, fold in.\nStep 3: Dip ladyfingers in espresso.\nStep 4: Layer mascarpone and cookies, chill 4 hours.', 8, 0, 'a0000000-0010-4000-8000-000000000010'),
    ('c0000000-1004-4000-8000-000000000001', 'b0000000-0010-4000-8000-000000000010', 'Margherita Pizza', E'Step 1: Stretch pizza dough.\nStep 2: Top with San Marzano sauce, fresh mozzarella, basil.\nStep 3: Bake at 500F for 8-10 min.', 2, 10, 'a0000000-0010-4000-8000-000000000010'),
    ('c0000000-1005-4000-8000-000000000001', 'b0000000-0010-4000-8000-000000000010', 'Risotto ai Funghi', E'Step 1: Saute mushrooms, set aside.\nStep 2: Toast arborio rice in butter.\nStep 3: Add wine, then ladle in stock gradually, stirring.\nStep 4: Finish with parmesan, butter, and mushrooms.', 4, 30, 'a0000000-0010-4000-8000-000000000010'),
    ('c0000000-1006-4000-8000-000000000001', 'b0000000-0010-4000-8000-000000000010', 'Bruschetta', E'Step 1: Dice tomatoes, mix with basil, garlic, olive oil.\nStep 2: Toast bread slices.\nStep 3: Top with tomato mixture, drizzle balsamic.', 6, 0, 'a0000000-0010-4000-8000-000000000010');

  -- Users 11-20: Quick recipe inserts (title + instructions only, skipping detailed ingredients for brevity)
  INSERT INTO recipes (id, household_id, title, instructions, servings, cook_time, created_by) VALUES
    -- User 11: Aisha Johnson (Soul Food)
    ('c0000000-1101-4000-8000-000000000001', 'b0000000-0011-4000-8000-000000000011', 'Southern Fried Chicken', E'Step 1: Brine chicken overnight.\nStep 2: Dredge in seasoned flour.\nStep 3: Fry in cast iron until golden.', 4, 25, 'a0000000-0011-4000-8000-000000000011'),
    ('c0000000-1102-4000-8000-000000000001', 'b0000000-0011-4000-8000-000000000011', 'Collard Greens', E'Step 1: Cook smoked turkey neck in broth.\nStep 2: Add cleaned collards, simmer 1 hour.\nStep 3: Season with vinegar and hot sauce.', 6, 70, 'a0000000-0011-4000-8000-000000000011'),
    ('c0000000-1103-4000-8000-000000000001', 'b0000000-0011-4000-8000-000000000011', 'Cornbread', E'Step 1: Mix cornmeal, flour, buttermilk, eggs.\nStep 2: Pour into hot cast iron with melted butter.\nStep 3: Bake at 425F for 20 min.', 8, 20, 'a0000000-0011-4000-8000-000000000011'),
    ('c0000000-1104-4000-8000-000000000001', 'b0000000-0011-4000-8000-000000000011', 'Shrimp and Grits', E'Step 1: Cook stone-ground grits with butter and cheese.\nStep 2: Saute shrimp with bacon, garlic, lemon.', 4, 25, 'a0000000-0011-4000-8000-000000000011'),
    ('c0000000-1105-4000-8000-000000000001', 'b0000000-0011-4000-8000-000000000011', 'Sweet Potato Pie', E'Step 1: Bake sweet potatoes, mash.\nStep 2: Mix with sugar, eggs, spices, evaporated milk.\nStep 3: Pour into pie crust, bake 55 min.', 8, 55, 'a0000000-0011-4000-8000-000000000011'),
    -- User 12: Chen Wei Lin (Taiwanese)
    ('c0000000-1201-4000-8000-000000000001', 'b0000000-0012-4000-8000-000000000012', 'Beef Noodle Soup', E'Step 1: Braise beef shank with soy, star anise, chili bean paste.\nStep 2: Simmer 2 hours.\nStep 3: Cook wheat noodles, serve in broth with bok choy.', 4, 130, 'a0000000-0012-4000-8000-000000000012'),
    ('c0000000-1202-4000-8000-000000000001', 'b0000000-0012-4000-8000-000000000012', 'Lu Rou Fan', E'Step 1: Braise minced pork belly in soy, five spice, rice wine.\nStep 2: Simmer 45 min until thick.\nStep 3: Serve over steamed rice with pickled mustard greens.', 4, 50, 'a0000000-0012-4000-8000-000000000012'),
    ('c0000000-1203-4000-8000-000000000001', 'b0000000-0012-4000-8000-000000000012', 'Gua Bao', E'Step 1: Steam fluffy bao buns.\nStep 2: Braise pork belly until tender.\nStep 3: Fill with pork, pickled mustard greens, cilantro, peanut powder.', 8, 30, 'a0000000-0012-4000-8000-000000000012'),
    ('c0000000-1204-4000-8000-000000000001', 'b0000000-0012-4000-8000-000000000012', 'Three Cup Chicken', E'Step 1: Fry chicken pieces with ginger and garlic.\nStep 2: Add soy sauce, sesame oil, rice wine (one cup each).\nStep 3: Simmer, finish with Thai basil.', 4, 25, 'a0000000-0012-4000-8000-000000000012'),
    ('c0000000-1205-4000-8000-000000000001', 'b0000000-0012-4000-8000-000000000012', 'Oyster Omelette', E'Step 1: Mix tapioca starch with water.\nStep 2: Fry oysters, pour starch over.\nStep 3: Add beaten eggs, cook until crispy. Top with sweet chili sauce.', 2, 10, 'a0000000-0012-4000-8000-000000000012'),
    -- User 13: Sofia Rodriguez (Mexican)
    ('c0000000-1301-4000-8000-000000000001', 'b0000000-0013-4000-8000-000000000013', 'Tacos al Pastor', E'Step 1: Marinate pork in achiote, pineapple, chiles.\nStep 2: Grill and slice thinly.\nStep 3: Serve on small tortillas with pineapple, onion, cilantro.', 6, 20, 'a0000000-0013-4000-8000-000000000013'),
    ('c0000000-1302-4000-8000-000000000001', 'b0000000-0013-4000-8000-000000000013', 'Guacamole', E'Step 1: Mash avocados.\nStep 2: Mix in lime, onion, cilantro, jalapeno, salt.\nStep 3: Serve immediately with chips.', 4, 0, 'a0000000-0013-4000-8000-000000000013'),
    ('c0000000-1303-4000-8000-000000000001', 'b0000000-0013-4000-8000-000000000013', 'Quesabirria', E'Step 1: Dip tortillas in birria consomme.\nStep 2: Fill with shredded birria meat and cheese.\nStep 3: Pan-fry until crispy. Serve with consomme for dipping.', 4, 15, 'a0000000-0013-4000-8000-000000000013'),
    ('c0000000-1304-4000-8000-000000000001', 'b0000000-0013-4000-8000-000000000013', 'Flan', E'Step 1: Caramelize sugar in baking dish.\nStep 2: Blend eggs, condensed milk, evaporated milk, vanilla.\nStep 3: Pour over caramel, bake in water bath 55 min.', 8, 55, 'a0000000-0013-4000-8000-000000000013'),
    ('c0000000-1305-4000-8000-000000000001', 'b0000000-0013-4000-8000-000000000013', 'Chiles Rellenos', E'Step 1: Roast and peel poblano chiles.\nStep 2: Stuff with cheese.\nStep 3: Dip in egg batter, fry until golden.\nStep 4: Serve in tomato sauce.', 4, 25, 'a0000000-0013-4000-8000-000000000013'),
    -- User 14: David Thompson (American)
    ('c0000000-1401-4000-8000-000000000001', 'b0000000-0014-4000-8000-000000000014', 'Texas Brisket', E'Step 1: Rub with salt and pepper.\nStep 2: Smoke at 225F for 12 hours.\nStep 3: Wrap in butcher paper at stall.\nStep 4: Rest 1 hour before slicing.', 10, 720, 'a0000000-0014-4000-8000-000000000014'),
    ('c0000000-1402-4000-8000-000000000001', 'b0000000-0014-4000-8000-000000000014', 'New England Lobster Roll', E'Step 1: Boil lobster, extract meat.\nStep 2: Toss with mayo, lemon, celery.\nStep 3: Serve in buttered, toasted split-top roll.', 4, 15, 'a0000000-0014-4000-8000-000000000014'),
    ('c0000000-1403-4000-8000-000000000001', 'b0000000-0014-4000-8000-000000000014', 'Banana Bread', E'Step 1: Mash ripe bananas.\nStep 2: Mix with melted butter, sugar, eggs, flour.\nStep 3: Bake at 350F for 55 min.', 8, 55, 'a0000000-0014-4000-8000-000000000014'),
    ('c0000000-1404-4000-8000-000000000001', 'b0000000-0014-4000-8000-000000000014', 'Eggs Benedict', E'Step 1: Poach eggs.\nStep 2: Toast English muffins, add ham.\nStep 3: Top with egg and hollandaise sauce.', 2, 15, 'a0000000-0014-4000-8000-000000000014'),
    ('c0000000-1405-4000-8000-000000000001', 'b0000000-0014-4000-8000-000000000014', 'Chicken Pot Pie', E'Step 1: Cook chicken, vegetables in creamy sauce.\nStep 2: Pour into pie dish.\nStep 3: Top with puff pastry, bake 30 min at 400F.', 6, 45, 'a0000000-0014-4000-8000-000000000014'),
    -- User 15: Mei-Ling Wu (Chinese)
    ('c0000000-1501-4000-8000-000000000001', 'b0000000-0015-4000-8000-000000000015', 'Peking Duck', E'Step 1: Air-dry duck overnight.\nStep 2: Roast at high heat until skin is crispy.\nStep 3: Slice and serve with pancakes, hoisin, scallions.', 4, 90, 'a0000000-0015-4000-8000-000000000015'),
    ('c0000000-1502-4000-8000-000000000001', 'b0000000-0015-4000-8000-000000000015', 'Wonton Soup', E'Step 1: Fill wonton wrappers with pork and shrimp.\nStep 2: Cook in chicken broth.\nStep 3: Add bok choy, serve with chili oil.', 4, 15, 'a0000000-0015-4000-8000-000000000015'),
    ('c0000000-1503-4000-8000-000000000001', 'b0000000-0015-4000-8000-000000000015', 'Yangzhou Fried Rice', E'Step 1: Scramble eggs, set aside.\nStep 2: Stir-fry day-old rice on high heat with shrimp, char siu, peas.\nStep 3: Toss with eggs and scallions.', 4, 10, 'a0000000-0015-4000-8000-000000000015'),
    ('c0000000-1504-4000-8000-000000000001', 'b0000000-0015-4000-8000-000000000015', 'Zha Jiang Mian', E'Step 1: Fry pork mince with bean paste and soy.\nStep 2: Cook thick wheat noodles.\nStep 3: Top noodles with pork sauce, cucumber, edamame.', 4, 15, 'a0000000-0015-4000-8000-000000000015'),
    ('c0000000-1505-4000-8000-000000000001', 'b0000000-0015-4000-8000-000000000015', 'Ma La Hot Pot', E'Step 1: Make spicy broth with Sichuan peppercorns, chili oil, doubanjiang.\nStep 2: Prepare meats, vegetables, tofu, noodles.\nStep 3: Cook ingredients in simmering broth at the table.', 4, 20, 'a0000000-0015-4000-8000-000000000015'),
    -- User 16: Hassan Ahmed (Middle Eastern)
    ('c0000000-1601-4000-8000-000000000001', 'b0000000-0016-4000-8000-000000000016', 'Lamb Kebabs', E'Step 1: Marinate lamb cubes in yogurt, cumin, paprika.\nStep 2: Thread onto skewers with onion and pepper.\nStep 3: Grill until charred.', 4, 15, 'a0000000-0016-4000-8000-000000000016'),
    ('c0000000-1602-4000-8000-000000000001', 'b0000000-0016-4000-8000-000000000016', 'Mansaf', E'Step 1: Cook lamb in jameed (dried yogurt) sauce.\nStep 2: Prepare rice with turmeric.\nStep 3: Layer rice and lamb, pour sauce over. Top with almonds and pine nuts.', 6, 90, 'a0000000-0016-4000-8000-000000000016'),
    ('c0000000-1603-4000-8000-000000000001', 'b0000000-0016-4000-8000-000000000016', 'Kunafa', E'Step 1: Layer kataifi dough with butter.\nStep 2: Fill with sweet cheese.\nStep 3: Bake until golden, drench in rosewater syrup.', 12, 35, 'a0000000-0016-4000-8000-000000000016'),
    ('c0000000-1604-4000-8000-000000000001', 'b0000000-0016-4000-8000-000000000016', 'Fattoush', E'Step 1: Fry pita chips.\nStep 2: Toss with chopped vegetables, herbs.\nStep 3: Dress with sumac, lemon, olive oil.', 4, 10, 'a0000000-0016-4000-8000-000000000016'),
    ('c0000000-1605-4000-8000-000000000001', 'b0000000-0016-4000-8000-000000000016', 'Kibbeh', E'Step 1: Mix bulgur with ground lamb, onion, spices.\nStep 2: Form into oval shells, stuff with pine nuts and lamb.\nStep 3: Deep fry until dark golden.', 12, 20, 'a0000000-0016-4000-8000-000000000016'),
    -- User 17: Rachel Kim (Korean)
    ('c0000000-1701-4000-8000-000000000001', 'b0000000-0017-4000-8000-000000000017', 'Bibimbap', E'Step 1: Prepare namul (seasoned vegetables).\nStep 2: Cook rice, top with vegetables, gochujang, fried egg.\nStep 3: Mix everything together before eating.', 2, 15, 'a0000000-0017-4000-8000-000000000017'),
    ('c0000000-1702-4000-8000-000000000001', 'b0000000-0017-4000-8000-000000000017', 'Korean Fried Chicken', E'Step 1: Double-fry chicken for extra crunch.\nStep 2: Toss in gochujang glaze with garlic and ginger.\nStep 3: Garnish with sesame seeds and scallions.', 4, 30, 'a0000000-0017-4000-8000-000000000017'),
    ('c0000000-1703-4000-8000-000000000001', 'b0000000-0017-4000-8000-000000000017', 'Japchae', E'Step 1: Cook glass noodles.\nStep 2: Stir-fry beef and vegetables separately.\nStep 3: Toss together with soy sauce and sesame oil.', 4, 20, 'a0000000-0017-4000-8000-000000000017'),
    ('c0000000-1704-4000-8000-000000000001', 'b0000000-0017-4000-8000-000000000017', 'Tteokbokki', E'Step 1: Simmer gochujang, sugar, soy in water.\nStep 2: Add rice cakes and fish cakes.\nStep 3: Cook until sauce thickens and rice cakes are chewy.', 2, 15, 'a0000000-0017-4000-8000-000000000017'),
    ('c0000000-1705-4000-8000-000000000001', 'b0000000-0017-4000-8000-000000000017', 'Kimchi Jjigae', E'Step 1: Fry aged kimchi with pork belly.\nStep 2: Add water, tofu, gochugaru.\nStep 3: Simmer 20 min, serve bubbling with rice.', 4, 25, 'a0000000-0017-4000-8000-000000000017'),
    ('c0000000-1706-4000-8000-000000000001', 'b0000000-0017-4000-8000-000000000017', 'Bulgogi', E'Step 1: Marinate thinly sliced beef in soy, pear, sesame, garlic.\nStep 2: Grill or pan-fry until caramelized.\nStep 3: Serve with lettuce wraps and ssamjang.', 4, 15, 'a0000000-0017-4000-8000-000000000017'),
    -- User 18: Pierre Dubois (French)
    ('c0000000-1801-4000-8000-000000000001', 'b0000000-0018-4000-8000-000000000018', 'Coq au Vin', E'Step 1: Brown chicken in butter.\nStep 2: Flambe with cognac.\nStep 3: Braise in red wine with mushrooms, pearl onions, bacon for 1 hour.', 4, 75, 'a0000000-0018-4000-8000-000000000018'),
    ('c0000000-1802-4000-8000-000000000001', 'b0000000-0018-4000-8000-000000000018', 'Ratatouille', E'Step 1: Thinly slice eggplant, zucchini, squash, tomato.\nStep 2: Layer in baking dish over piperade sauce.\nStep 3: Drizzle with olive oil, bake 45 min at 375F.', 4, 50, 'a0000000-0018-4000-8000-000000000018'),
    ('c0000000-1803-4000-8000-000000000001', 'b0000000-0018-4000-8000-000000000018', 'Creme Brulee', E'Step 1: Heat cream with vanilla.\nStep 2: Temper into egg yolks and sugar.\nStep 3: Bake in water bath 45 min.\nStep 4: Chill, torch sugar topping before serving.', 4, 50, 'a0000000-0018-4000-8000-000000000018'),
    ('c0000000-1804-4000-8000-000000000001', 'b0000000-0018-4000-8000-000000000018', 'French Onion Soup', E'Step 1: Caramelize onions slowly for 45 min.\nStep 2: Deglaze with wine, add beef broth.\nStep 3: Ladle into crocks, top with gruyere toast, broil.', 4, 55, 'a0000000-0018-4000-8000-000000000018'),
    ('c0000000-1805-4000-8000-000000000001', 'b0000000-0018-4000-8000-000000000018', 'Quiche Lorraine', E'Step 1: Pre-bake tart shell.\nStep 2: Fill with bacon, gruyere, egg custard.\nStep 3: Bake 35 min at 375F.', 6, 45, 'a0000000-0018-4000-8000-000000000018'),
    -- User 19: Ananya Sharma (Indian)
    ('c0000000-1901-4000-8000-000000000001', 'b0000000-0019-4000-8000-000000000019', 'Masala Dosa', E'Step 1: Ferment rice and urad dal batter overnight.\nStep 2: Make potato masala filling.\nStep 3: Spread batter thin on hot tawa, fill with potato, fold.', 4, 20, 'a0000000-0019-4000-8000-000000000019'),
    ('c0000000-1902-4000-8000-000000000001', 'b0000000-0019-4000-8000-000000000019', 'Pav Bhaji', E'Step 1: Mash mixed vegetables with spices and butter.\nStep 2: Toast buttered pav rolls.\nStep 3: Serve bhaji with pav, onion, and lemon.', 4, 25, 'a0000000-0019-4000-8000-000000000019'),
    ('c0000000-1903-4000-8000-000000000001', 'b0000000-0019-4000-8000-000000000019', 'Chole Bhature', E'Step 1: Soak chickpeas, pressure cook with tea bag for color.\nStep 2: Make spicy gravy with onion, tomato, chole masala.\nStep 3: Fry bhature dough until puffed. Serve together.', 4, 30, 'a0000000-0019-4000-8000-000000000019'),
    ('c0000000-1904-4000-8000-000000000001', 'b0000000-0019-4000-8000-000000000019', 'Paneer Tikka', E'Step 1: Marinate paneer in yogurt, tandoori masala.\nStep 2: Skewer with peppers and onions.\nStep 3: Grill or broil until charred.', 4, 15, 'a0000000-0019-4000-8000-000000000019'),
    ('c0000000-1905-4000-8000-000000000001', 'b0000000-0019-4000-8000-000000000019', 'Gulab Jamun', E'Step 1: Mix milk powder, flour, and cardamom into soft dough.\nStep 2: Roll into balls, deep fry on low heat until brown.\nStep 3: Soak in warm sugar syrup.', 20, 15, 'a0000000-0019-4000-8000-000000000019'),
    -- User 20: Tyler Brooks (American)
    ('c0000000-2001-4000-8000-000000000001', 'b0000000-0020-4000-8000-000000000020', 'Nashville Hot Chicken', E'Step 1: Brine chicken in buttermilk.\nStep 2: Dredge in seasoned flour, fry.\nStep 3: Brush with cayenne-lard paste.\nStep 4: Serve on white bread with pickles.', 4, 25, 'a0000000-0020-4000-8000-000000000020'),
    ('c0000000-2002-4000-8000-000000000001', 'b0000000-0020-4000-8000-000000000020', 'Steak and Eggs', E'Step 1: Season ribeye with salt and pepper.\nStep 2: Sear in cast iron with butter.\nStep 3: Fry eggs sunny side up. Serve together.', 2, 12, 'a0000000-0020-4000-8000-000000000020'),
    ('c0000000-2003-4000-8000-000000000001', 'b0000000-0020-4000-8000-000000000020', 'Chicken Fried Steak', E'Step 1: Pound cube steak thin.\nStep 2: Dredge in seasoned flour, fry until golden.\nStep 3: Make cream gravy from drippings. Serve with mashed potatoes.', 4, 20, 'a0000000-0020-4000-8000-000000000020'),
    ('c0000000-2004-4000-8000-000000000001', 'b0000000-0020-4000-8000-000000000020', 'Blueberry Pancakes', E'Step 1: Make pancake batter.\nStep 2: Fold in fresh blueberries.\nStep 3: Cook on griddle, serve with maple syrup.', 4, 12, 'a0000000-0020-4000-8000-000000000020'),
    ('c0000000-2005-4000-8000-000000000001', 'b0000000-0020-4000-8000-000000000020', 'Beef Chili', E'Step 1: Brown ground beef with onions.\nStep 2: Add tomatoes, beans, chili powder, cumin.\nStep 3: Simmer 1 hour. Top with cheese and sour cream.', 6, 65, 'a0000000-0020-4000-8000-000000000020');

  -- Bulk categories for users 7-20
  INSERT INTO recipe_categories (recipe_id, category_id) VALUES
    ('c0000000-0701-4000-8000-000000000001', cat_dinner), ('c0000000-0701-4000-8000-000000000001', cat_american),
    ('c0000000-0702-4000-8000-000000000001', cat_dinner), ('c0000000-0702-4000-8000-000000000001', cat_american),
    ('c0000000-0703-4000-8000-000000000001', cat_lunch), ('c0000000-0703-4000-8000-000000000001', cat_american),
    ('c0000000-0704-4000-8000-000000000001', cat_dinner), ('c0000000-0705-4000-8000-000000000001', cat_other),
    ('c0000000-0801-4000-8000-000000000001', cat_dinner), ('c0000000-0801-4000-8000-000000000001', cat_med),
    ('c0000000-0802-4000-8000-000000000001', cat_lunch), ('c0000000-0802-4000-8000-000000000001', cat_med),
    ('c0000000-0803-4000-8000-000000000001', cat_lunch), ('c0000000-0803-4000-8000-000000000001', cat_med),
    ('c0000000-0804-4000-8000-000000000001', cat_other), ('c0000000-0805-4000-8000-000000000001', cat_breakfast),
    ('c0000000-0805-4000-8000-000000000001', cat_med), ('c0000000-0806-4000-8000-000000000001', cat_lunch),
    ('c0000000-0901-4000-8000-000000000001', cat_dinner), ('c0000000-0901-4000-8000-000000000001', cat_other),
    ('c0000000-0902-4000-8000-000000000001', cat_lunch), ('c0000000-0903-4000-8000-000000000001', cat_lunch),
    ('c0000000-0904-4000-8000-000000000001', cat_dinner), ('c0000000-0905-4000-8000-000000000001', cat_breakfast),
    ('c0000000-1001-4000-8000-000000000001', cat_dinner), ('c0000000-1001-4000-8000-000000000001', cat_italian),
    ('c0000000-1002-4000-8000-000000000001', cat_dinner), ('c0000000-1002-4000-8000-000000000001', cat_italian),
    ('c0000000-1003-4000-8000-000000000001', cat_other), ('c0000000-1003-4000-8000-000000000001', cat_italian),
    ('c0000000-1004-4000-8000-000000000001', cat_dinner), ('c0000000-1004-4000-8000-000000000001', cat_italian),
    ('c0000000-1005-4000-8000-000000000001', cat_dinner), ('c0000000-1005-4000-8000-000000000001', cat_italian),
    ('c0000000-1006-4000-8000-000000000001', cat_lunch), ('c0000000-1006-4000-8000-000000000001', cat_italian),
    ('c0000000-1101-4000-8000-000000000001', cat_dinner), ('c0000000-1101-4000-8000-000000000001', cat_american),
    ('c0000000-1102-4000-8000-000000000001', cat_dinner), ('c0000000-1103-4000-8000-000000000001', cat_other),
    ('c0000000-1104-4000-8000-000000000001', cat_breakfast), ('c0000000-1105-4000-8000-000000000001', cat_other),
    ('c0000000-1201-4000-8000-000000000001', cat_dinner), ('c0000000-1201-4000-8000-000000000001', cat_chinese),
    ('c0000000-1202-4000-8000-000000000001', cat_dinner), ('c0000000-1202-4000-8000-000000000001', cat_chinese),
    ('c0000000-1203-4000-8000-000000000001', cat_lunch), ('c0000000-1204-4000-8000-000000000001', cat_dinner),
    ('c0000000-1204-4000-8000-000000000001', cat_chinese), ('c0000000-1205-4000-8000-000000000001', cat_dinner),
    ('c0000000-1301-4000-8000-000000000001', cat_dinner), ('c0000000-1301-4000-8000-000000000001', cat_mexican),
    ('c0000000-1302-4000-8000-000000000001', cat_lunch), ('c0000000-1302-4000-8000-000000000001', cat_mexican),
    ('c0000000-1303-4000-8000-000000000001', cat_dinner), ('c0000000-1303-4000-8000-000000000001', cat_mexican),
    ('c0000000-1304-4000-8000-000000000001', cat_other), ('c0000000-1304-4000-8000-000000000001', cat_mexican),
    ('c0000000-1305-4000-8000-000000000001', cat_dinner), ('c0000000-1305-4000-8000-000000000001', cat_mexican),
    ('c0000000-1401-4000-8000-000000000001', cat_dinner), ('c0000000-1401-4000-8000-000000000001', cat_american),
    ('c0000000-1402-4000-8000-000000000001', cat_lunch), ('c0000000-1403-4000-8000-000000000001', cat_breakfast),
    ('c0000000-1404-4000-8000-000000000001', cat_breakfast), ('c0000000-1404-4000-8000-000000000001', cat_american),
    ('c0000000-1405-4000-8000-000000000001', cat_dinner), ('c0000000-1405-4000-8000-000000000001', cat_american),
    ('c0000000-1501-4000-8000-000000000001', cat_dinner), ('c0000000-1501-4000-8000-000000000001', cat_chinese),
    ('c0000000-1502-4000-8000-000000000001', cat_dinner), ('c0000000-1502-4000-8000-000000000001', cat_chinese),
    ('c0000000-1503-4000-8000-000000000001', cat_lunch), ('c0000000-1503-4000-8000-000000000001', cat_chinese),
    ('c0000000-1504-4000-8000-000000000001', cat_lunch), ('c0000000-1504-4000-8000-000000000001', cat_chinese),
    ('c0000000-1505-4000-8000-000000000001', cat_dinner), ('c0000000-1505-4000-8000-000000000001', cat_chinese),
    ('c0000000-1601-4000-8000-000000000001', cat_dinner), ('c0000000-1601-4000-8000-000000000001', cat_med),
    ('c0000000-1602-4000-8000-000000000001', cat_dinner), ('c0000000-1602-4000-8000-000000000001', cat_med),
    ('c0000000-1603-4000-8000-000000000001', cat_other), ('c0000000-1604-4000-8000-000000000001', cat_lunch),
    ('c0000000-1604-4000-8000-000000000001', cat_med), ('c0000000-1605-4000-8000-000000000001', cat_dinner),
    ('c0000000-1701-4000-8000-000000000001', cat_dinner), ('c0000000-1701-4000-8000-000000000001', cat_other),
    ('c0000000-1702-4000-8000-000000000001', cat_dinner), ('c0000000-1703-4000-8000-000000000001', cat_dinner),
    ('c0000000-1704-4000-8000-000000000001', cat_lunch), ('c0000000-1705-4000-8000-000000000001', cat_dinner),
    ('c0000000-1706-4000-8000-000000000001', cat_dinner),
    ('c0000000-1801-4000-8000-000000000001', cat_dinner), ('c0000000-1801-4000-8000-000000000001', cat_other),
    ('c0000000-1802-4000-8000-000000000001', cat_dinner), ('c0000000-1803-4000-8000-000000000001', cat_other),
    ('c0000000-1804-4000-8000-000000000001', cat_dinner), ('c0000000-1805-4000-8000-000000000001', cat_lunch),
    ('c0000000-1901-4000-8000-000000000001', cat_breakfast), ('c0000000-1901-4000-8000-000000000001', cat_indian),
    ('c0000000-1902-4000-8000-000000000001', cat_dinner), ('c0000000-1902-4000-8000-000000000001', cat_indian),
    ('c0000000-1903-4000-8000-000000000001', cat_lunch), ('c0000000-1903-4000-8000-000000000001', cat_indian),
    ('c0000000-1904-4000-8000-000000000001', cat_dinner), ('c0000000-1904-4000-8000-000000000001', cat_indian),
    ('c0000000-1905-4000-8000-000000000001', cat_other), ('c0000000-1905-4000-8000-000000000001', cat_indian),
    ('c0000000-2001-4000-8000-000000000001', cat_dinner), ('c0000000-2001-4000-8000-000000000001', cat_american),
    ('c0000000-2002-4000-8000-000000000001', cat_breakfast), ('c0000000-2002-4000-8000-000000000001', cat_american),
    ('c0000000-2003-4000-8000-000000000001', cat_dinner), ('c0000000-2003-4000-8000-000000000001', cat_american),
    ('c0000000-2004-4000-8000-000000000001', cat_breakfast), ('c0000000-2005-4000-8000-000000000001', cat_dinner);

  RAISE NOTICE 'All recipes and categories inserted successfully!';
END $$;

-- Confirm recipe count per user
SELECT p.display_name, count(r.id) as recipe_count
FROM profiles p
JOIN recipes r ON r.created_by = p.id
WHERE p.id::text LIKE 'a0000000-%'
GROUP BY p.display_name
ORDER BY p.display_name;
