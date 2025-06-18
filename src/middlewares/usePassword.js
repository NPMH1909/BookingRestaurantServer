import bcrypt from 'bcryptjs'; 
const saltRounds = 10;

const createHash = async (data) => {
  try {
    const hash = await bcrypt.hash(data, saltRounds);
    return hash;
  } catch (error) {
    console.error('Error creating hash:', error);
    throw error;
  }
};

const checkPassword = async (data, key, hash) => {
  try {
    const result = await bcrypt.compare(data + key, hash);
    return result;
  } catch (error) {
    console.error('Error comparing password:', error);
    throw error;
  }
};

export { createHash, checkPassword };
