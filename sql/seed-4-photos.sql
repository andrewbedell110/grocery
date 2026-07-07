-- ============================================================
-- SEED SCRIPT 4: Add photos to all seed recipes
-- Uses Unsplash Source for free, no-auth food images
-- ============================================================

UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&h=400&fit=crop' WHERE id = 'c0000000-0101-4000-8000-000000000001'; -- Pancakes
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&h=400&fit=crop' WHERE id = 'c0000000-0102-4000-8000-000000000001'; -- Pulled Pork
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=600&h=400&fit=crop' WHERE id = 'c0000000-0103-4000-8000-000000000001'; -- Caesar Salad
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=600&h=400&fit=crop' WHERE id = 'c0000000-0104-4000-8000-000000000001'; -- Mac and Cheese
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&h=400&fit=crop' WHERE id = 'c0000000-0105-4000-8000-000000000001'; -- Chocolate Chip Cookies
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&h=400&fit=crop' WHERE id = 'c0000000-0106-4000-8000-000000000001'; -- Chicken Wrap
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1588566565463-180a5b2090d2?w=600&h=400&fit=crop' WHERE id = 'c0000000-0107-4000-8000-000000000001'; -- Clam Chowder

-- Carlos (Mexican)
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1613514785940-daed07799d9b?w=600&h=400&fit=crop' WHERE id = 'c0000000-0201-4000-8000-000000000001'; -- Birria Tacos
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1534352956036-cd81e27dd615?w=600&h=400&fit=crop' WHERE id = 'c0000000-0202-4000-8000-000000000001'; -- Enchiladas
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=600&h=400&fit=crop' WHERE id = 'c0000000-0203-4000-8000-000000000001'; -- Pozole
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600&h=400&fit=crop' WHERE id = 'c0000000-0204-4000-8000-000000000001'; -- Chilaquiles
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1624371414361-e670246ae8f9?w=600&h=400&fit=crop' WHERE id = 'c0000000-0205-4000-8000-000000000001'; -- Churros
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop' WHERE id = 'c0000000-0206-4000-8000-000000000001'; -- Carne Asada
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1586511925558-a4c6376fe65f?w=600&h=400&fit=crop' WHERE id = 'c0000000-0207-4000-8000-000000000001'; -- Tamales
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1470119693884-47d3a1f1828e?w=600&h=400&fit=crop' WHERE id = 'c0000000-0208-4000-8000-000000000001'; -- Elote

-- Wei (Chinese)
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1582452919408-aca2c1e8e35c?w=600&h=400&fit=crop' WHERE id = 'c0000000-0301-4000-8000-000000000001'; -- Mapo Tofu
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=600&h=400&fit=crop' WHERE id = 'c0000000-0302-4000-8000-000000000001'; -- Kung Pao
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=400&fit=crop' WHERE id = 'c0000000-0303-4000-8000-000000000001'; -- Dan Dan Noodles
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=600&h=400&fit=crop' WHERE id = 'c0000000-0304-4000-8000-000000000001'; -- Scallion Pancakes
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&h=400&fit=crop' WHERE id = 'c0000000-0305-4000-8000-000000000001'; -- Hot and Sour Soup
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop' WHERE id = 'c0000000-0306-4000-8000-000000000001'; -- Char Siu

-- Priya (Indian)
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&h=400&fit=crop' WHERE id = 'c0000000-0401-4000-8000-000000000001'; -- Butter Chicken
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&h=400&fit=crop' WHERE id = 'c0000000-0402-4000-8000-000000000001'; -- Dal Makhani
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&h=400&fit=crop' WHERE id = 'c0000000-0403-4000-8000-000000000001'; -- Biryani
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&h=400&fit=crop' WHERE id = 'c0000000-0404-4000-8000-000000000001'; -- Palak Paneer
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&h=400&fit=crop&q=80' WHERE id = 'c0000000-0405-4000-8000-000000000001'; -- Samosas
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=600&h=400&fit=crop' WHERE id = 'c0000000-0406-4000-8000-000000000001'; -- Masala Chai

-- Yuki (Japanese)
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=600&h=400&fit=crop' WHERE id = 'c0000000-0501-4000-8000-000000000001'; -- Ramen
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=600&h=400&fit=crop&q=80' WHERE id = 'c0000000-0502-4000-8000-000000000001'; -- Gyoza
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&h=400&fit=crop' WHERE id = 'c0000000-0503-4000-8000-000000000001'; -- Teriyaki Salmon
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&h=400&fit=crop' WHERE id = 'c0000000-0504-4000-8000-000000000001'; -- Katsu Curry
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&h=400&fit=crop&q=80' WHERE id = 'c0000000-0505-4000-8000-000000000001'; -- Miso Soup

-- Maria (Mexican)
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=600&h=400&fit=crop' WHERE id = 'c0000000-0601-4000-8000-000000000001'; -- Mole
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600&h=400&fit=crop' WHERE id = 'c0000000-0602-4000-8000-000000000001'; -- Carnitas
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=600&h=400&fit=crop' WHERE id = 'c0000000-0603-4000-8000-000000000001'; -- Tres Leches
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&h=400&fit=crop' WHERE id = 'c0000000-0604-4000-8000-000000000001'; -- Sopes
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=600&h=400&fit=crop' WHERE id = 'c0000000-0605-4000-8000-000000000001'; -- Horchata

-- James (American)
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop' WHERE id = 'c0000000-0701-4000-8000-000000000001'; -- Burgers
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=600&h=400&fit=crop' WHERE id = 'c0000000-0702-4000-8000-000000000001'; -- Wings
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=600&h=400&fit=crop' WHERE id = 'c0000000-0703-4000-8000-000000000001'; -- Cheesesteak
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&h=400&fit=crop&q=70' WHERE id = 'c0000000-0704-4000-8000-000000000001'; -- Potato Soup
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1535920527002-b35e96722eb9?w=600&h=400&fit=crop' WHERE id = 'c0000000-0705-4000-8000-000000000001'; -- Apple Pie

-- Fatima (Middle Eastern)
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&h=400&fit=crop' WHERE id = 'c0000000-0801-4000-8000-000000000001'; -- Shawarma
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1593001872095-7d5b3868fb1d?w=600&h=400&fit=crop' WHERE id = 'c0000000-0802-4000-8000-000000000001'; -- Falafel
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=600&h=400&fit=crop' WHERE id = 'c0000000-0803-4000-8000-000000000001'; -- Hummus
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1519676867240-f03562e64571?w=600&h=400&fit=crop' WHERE id = 'c0000000-0804-4000-8000-000000000001'; -- Baklava
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1590412200988-a436970781fa?w=600&h=400&fit=crop' WHERE id = 'c0000000-0805-4000-8000-000000000001'; -- Shakshuka
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1540914124281-342587941389?w=600&h=400&fit=crop' WHERE id = 'c0000000-0806-4000-8000-000000000001'; -- Tabbouleh

-- Kim Nguyen (Vietnamese)
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&h=400&fit=crop' WHERE id = 'c0000000-0901-4000-8000-000000000001'; -- Pho
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1600688640154-9619e002df30?w=600&h=400&fit=crop' WHERE id = 'c0000000-0902-4000-8000-000000000001'; -- Banh Mi
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=600&h=400&fit=crop' WHERE id = 'c0000000-0903-4000-8000-000000000001'; -- Spring Rolls
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=600&h=400&fit=crop' WHERE id = 'c0000000-0904-4000-8000-000000000001'; -- Bun Cha
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=400&fit=crop' WHERE id = 'c0000000-0905-4000-8000-000000000001'; -- Vietnamese Coffee

-- Luigi (Italian)
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600&h=400&fit=crop' WHERE id = 'c0000000-1001-4000-8000-000000000001'; -- Carbonara
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop&q=80' WHERE id = 'c0000000-1002-4000-8000-000000000001'; -- Osso Buco
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&h=400&fit=crop' WHERE id = 'c0000000-1003-4000-8000-000000000001'; -- Tiramisu
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&h=400&fit=crop' WHERE id = 'c0000000-1004-4000-8000-000000000001'; -- Pizza
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&h=400&fit=crop' WHERE id = 'c0000000-1005-4000-8000-000000000001'; -- Risotto
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=600&h=400&fit=crop' WHERE id = 'c0000000-1006-4000-8000-000000000001'; -- Bruschetta

-- Aisha (Soul Food)
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600&h=400&fit=crop' WHERE id = 'c0000000-1101-4000-8000-000000000001'; -- Fried Chicken
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&h=400&fit=crop' WHERE id = 'c0000000-1102-4000-8000-000000000001'; -- Collard Greens
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1558303408-57e47f54e461?w=600&h=400&fit=crop' WHERE id = 'c0000000-1103-4000-8000-000000000001'; -- Cornbread
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1536304993881-8bfbb9b8a717?w=600&h=400&fit=crop' WHERE id = 'c0000000-1104-4000-8000-000000000001'; -- Shrimp and Grits
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1621955511667-e2c316e4575d?w=600&h=400&fit=crop' WHERE id = 'c0000000-1105-4000-8000-000000000001'; -- Sweet Potato Pie

-- Chen Wei Lin (Taiwanese)
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=600&h=400&fit=crop' WHERE id = 'c0000000-1201-4000-8000-000000000001'; -- Beef Noodle Soup
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=600&h=400&fit=crop&q=80' WHERE id = 'c0000000-1202-4000-8000-000000000001'; -- Lu Rou Fan
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&h=400&fit=crop' WHERE id = 'c0000000-1203-4000-8000-000000000001'; -- Gua Bao
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&h=400&fit=crop' WHERE id = 'c0000000-1204-4000-8000-000000000001'; -- Three Cup Chicken
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop' WHERE id = 'c0000000-1205-4000-8000-000000000001'; -- Oyster Omelette

-- Sofia (Mexican)
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600&h=400&fit=crop&q=80' WHERE id = 'c0000000-1301-4000-8000-000000000001'; -- Tacos al Pastor
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&h=400&fit=crop' WHERE id = 'c0000000-1302-4000-8000-000000000001'; -- Guacamole
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=600&h=400&fit=crop&q=80' WHERE id = 'c0000000-1303-4000-8000-000000000001'; -- Quesabirria
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop' WHERE id = 'c0000000-1304-4000-8000-000000000001'; -- Flan
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1534352956036-cd81e27dd615?w=600&h=400&fit=crop&q=80' WHERE id = 'c0000000-1305-4000-8000-000000000001'; -- Chiles Rellenos

-- David (American)
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&h=400&fit=crop&q=80' WHERE id = 'c0000000-1401-4000-8000-000000000001'; -- Brisket
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=400&fit=crop' WHERE id = 'c0000000-1402-4000-8000-000000000001'; -- Lobster Roll
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1558401391-7899b3b42e29?w=600&h=400&fit=crop' WHERE id = 'c0000000-1403-4000-8000-000000000001'; -- Banana Bread
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=600&h=400&fit=crop&q=80' WHERE id = 'c0000000-1404-4000-8000-000000000001'; -- Eggs Benedict
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?w=600&h=400&fit=crop' WHERE id = 'c0000000-1405-4000-8000-000000000001'; -- Chicken Pot Pie

-- Mei-Ling (Chinese)
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1518492104633-130d0cc84637?w=600&h=400&fit=crop' WHERE id = 'c0000000-1501-4000-8000-000000000001'; -- Peking Duck
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&h=400&fit=crop' WHERE id = 'c0000000-1502-4000-8000-000000000001'; -- Wonton Soup
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&h=400&fit=crop' WHERE id = 'c0000000-1503-4000-8000-000000000001'; -- Fried Rice
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=600&h=400&fit=crop&q=80' WHERE id = 'c0000000-1504-4000-8000-000000000001'; -- Zha Jiang Mian
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1583032015879-e5022cb87c3b?w=600&h=400&fit=crop' WHERE id = 'c0000000-1505-4000-8000-000000000001'; -- Hot Pot

-- Hassan (Middle Eastern)
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&h=400&fit=crop&q=80' WHERE id = 'c0000000-1601-4000-8000-000000000001'; -- Kebabs
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&h=400&fit=crop&q=80' WHERE id = 'c0000000-1602-4000-8000-000000000001'; -- Mansaf
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1519676867240-f03562e64571?w=600&h=400&fit=crop&q=80' WHERE id = 'c0000000-1603-4000-8000-000000000001'; -- Kunafa
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1540914124281-342587941389?w=600&h=400&fit=crop&q=80' WHERE id = 'c0000000-1604-4000-8000-000000000001'; -- Fattoush
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=600&h=400&fit=crop' WHERE id = 'c0000000-1605-4000-8000-000000000001'; -- Kibbeh

-- Rachel (Korean)
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=600&h=400&fit=crop' WHERE id = 'c0000000-1701-4000-8000-000000000001'; -- Bibimbap
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1575932444877-5106bee2a599?w=600&h=400&fit=crop' WHERE id = 'c0000000-1702-4000-8000-000000000001'; -- Korean Fried Chicken
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&h=400&fit=crop' WHERE id = 'c0000000-1703-4000-8000-000000000001'; -- Japchae
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1635363638580-c2809d049eee?w=600&h=400&fit=crop' WHERE id = 'c0000000-1704-4000-8000-000000000001'; -- Tteokbokki
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=600&h=400&fit=crop' WHERE id = 'c0000000-1705-4000-8000-000000000001'; -- Kimchi Jjigae
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&h=400&fit=crop' WHERE id = 'c0000000-1706-4000-8000-000000000001'; -- Bulgogi

-- Pierre (French)
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&h=400&fit=crop' WHERE id = 'c0000000-1801-4000-8000-000000000001'; -- Coq au Vin
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1572453800999-e8d2d1589b7c?w=600&h=400&fit=crop' WHERE id = 'c0000000-1802-4000-8000-000000000001'; -- Ratatouille
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=600&h=400&fit=crop' WHERE id = 'c0000000-1803-4000-8000-000000000001'; -- Creme Brulee
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&h=400&fit=crop&q=60' WHERE id = 'c0000000-1804-4000-8000-000000000001'; -- French Onion Soup
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=600&h=400&fit=crop' WHERE id = 'c0000000-1805-4000-8000-000000000001'; -- Quiche

-- Ananya (Indian)
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=600&h=400&fit=crop' WHERE id = 'c0000000-1901-4000-8000-000000000001'; -- Dosa
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=600&h=400&fit=crop' WHERE id = 'c0000000-1902-4000-8000-000000000001'; -- Pav Bhaji
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&h=400&fit=crop' WHERE id = 'c0000000-1903-4000-8000-000000000001'; -- Chole Bhature
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&h=400&fit=crop' WHERE id = 'c0000000-1904-4000-8000-000000000001'; -- Paneer Tikka
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1666190020955-5765e5fdc276?w=600&h=400&fit=crop' WHERE id = 'c0000000-1905-4000-8000-000000000001'; -- Gulab Jamun

-- Tyler (American)
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600&h=400&fit=crop&q=80' WHERE id = 'c0000000-2001-4000-8000-000000000001'; -- Hot Chicken
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=600&h=400&fit=crop&q=80' WHERE id = 'c0000000-2002-4000-8000-000000000001'; -- Steak and Eggs
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?w=600&h=400&fit=crop&q=80' WHERE id = 'c0000000-2003-4000-8000-000000000001'; -- Chicken Fried Steak
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&h=400&fit=crop&q=80' WHERE id = 'c0000000-2004-4000-8000-000000000001'; -- Blueberry Pancakes
UPDATE recipes SET image_url = 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&h=400&fit=crop' WHERE id = 'c0000000-2005-4000-8000-000000000001'; -- Beef Chili

-- Confirm
SELECT title, CASE WHEN image_url IS NOT NULL THEN 'has photo' ELSE 'NO PHOTO' END as status
FROM recipes WHERE id::text LIKE 'c0000000-%'
ORDER BY title;
