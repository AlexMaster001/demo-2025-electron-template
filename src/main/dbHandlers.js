export const getPartners = async () => {
  try {
    const result = await global.dbclient.query(`
      SELECT T1.*,
        CASE 
          WHEN sum(T2.production_quantity) > 300000 THEN 15
          WHEN sum(T2.production_quantity) > 50000 THEN 10
          WHEN sum(T2.production_quantity) > 10000 THEN 5
          ELSE 0 
        END as discount
      FROM partners AS T1
      LEFT JOIN sales AS T2 ON T1.id = T2.partner_id
      GROUP BY T1.id
    `);
    return result.rows;
  } catch (e) {
    console.error('Ошибка получения партнёров:', e);
    throw new Error('Не удалось получить список партнёров');
  }
};

export const createPartner = async (partner) => {
  const { type, name, ceo, email, phone, address, rating } = partner;

  const query = `
    INSERT INTO partners (organization_type, name, ceo, email, phone, address, rating)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `;
  const values = [type, name, ceo, email, phone, address, rating];

  try {
    await global.dbclient.query(query, values);
    return true;
  } catch (e) {
    if (e.code === '23505') { // unique violation
      throw new Error('Партнер с таким именем уже существует');
    }
    console.error('Ошибка создания партнёра:', e);
    throw new Error('Не удалось создать партнёра');
  }
};

export const updatePartner = async (partner) => {
  const { id, type, name, ceo, email, phone, address, rating } = partner;

  const query = `
    UPDATE partners
    SET organization_type = $1, name = $2, ceo = $3, email = $4, phone = $5, address = $6, rating = $7
    WHERE id = $8
  `;
  const values = [type, name, ceo, email, phone, address, rating, id];

  try {
    await global.dbclient.query(query, values);
    return true;
  } catch (e) {
    console.error('Ошибка обновления партнёра:', e);
    throw new Error('Не удалось обновить партнёра');
  }
};