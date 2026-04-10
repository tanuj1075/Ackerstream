/**
 * /server/utils/paginate.js
 * Generic Sequelize pagination wrapper.
 * Returns consistent { data, pagination } envelope used across the API.
 */

/**
 * @param {import('sequelize').Model} Model   - Sequelize model class
 * @param {object}  findOptions              - Standard Sequelize findAndCountAll options (where, include, order…)
 * @param {object}  queryParams              - Raw query params from req.query
 * @param {number}  queryParams.page
 * @param {number}  queryParams.limit
 * @returns {Promise<{ data: any[], pagination: object }>}
 */
async function paginate(Model, findOptions = {}, queryParams = {}) {
  const page  = Math.max(1, parseInt(queryParams.page)  || 1);
  const limit = Math.min(50, Math.max(1, parseInt(queryParams.limit) || 10));
  const offset = (page - 1) * limit;

  const { count, rows } = await Model.findAndCountAll({
    ...findOptions,
    limit,
    offset,
    distinct: true   // needed when using includes with hasMany
  });

  const totalPages = Math.ceil(count / limit);

  return {
    data: rows,
    pagination: {
      total:      count,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
}

module.exports = paginate;
