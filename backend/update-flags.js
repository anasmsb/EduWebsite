const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('education_website', 'root', '7710', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false
});

async function updateFlagsToEmojis() {
  try {
    console.log('🔄 Updating flag paths to emojis...');
    
    // Update existing flags
    await sequelize.query("UPDATE languages SET flag = '🇺🇸' WHERE code = 'en'");
    await sequelize.query("UPDATE languages SET flag = '🇦' WHERE code = 'ar'");
    await sequelize.query("UPDATE languages SET flag = '��' WHERE code = 'ur'");
    
    // Check what languages exist
    const [existing] = await sequelize.query('SELECT code FROM languages');
    const existingCodes = existing.map(l => l.code);
    
    // Add missing languages
    if (!existingCodes.includes('es')) {
      await sequelize.query(`
        INSERT INTO languages (name, code, nativeName, direction, isActive, isDefault, flag, createdById, createdAt, updatedAt)
        VALUES ('Spanish', 'es', 'Español', 'ltr', TRUE, FALSE, '🇸', 1, NOW(), NOW())
      `);
      console.log('Added Spanish');
    }
    
    if (!existingCodes.includes('fr')) {
      await sequelize.query(`
        INSERT INTO languages (name, code, nativeName, direction, isActive, isDefault, flag, createdById, createdAt, updatedAt)
        VALUES ('French', 'fr', 'Français', 'ltr', TRUE, FALSE, '��', 1, NOW(), NOW())
      `);
      console.log('Added French');
    }
    
    if (!existingCodes.includes('de')) {
      await sequelize.query(`
        INSERT INTO languages (name, code, nativeName, direction, isActive, isDefault, flag, createdById, createdAt, updatedAt)
        VALUES ('German', 'de', 'Deutsch', 'ltr', TRUE, FALSE, '🇩🇪', 1, NOW(), NOW())
      `);
      console.log('Added German');
    }
    
    if (!existingCodes.includes('zh')) {
      await sequelize.query(`
        INSERT INTO languages (name, code, nativeName, direction, isActive, isDefault, flag, createdById, createdAt, updatedAt)
        VALUES ('Chinese', 'zh', '中文', 'ltr', TRUE, FALSE, '🇨🇳', 1, NOW(), NOW())
      `);
      console.log('Added Chinese');
    }
    
    console.log('✅ Flag emojis updated successfully');
    
    // Verify the update
    const [results] = await sequelize.query('SELECT name, code, flag FROM languages ORDER BY name');
    console.log('Updated languages:', results);
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error updating flags:', error);
    await sequelize.close();
  }
}

updateFlagsToEmojis();