const authRoutes = require('./auth');
const vendorRoutes = require('./vendors');
const customerRoutes = require('./customers');
const serviceRoutes = require('./services');
const categoriesRoutes = require('./categories');

const couponsRoutes = require('./coupons');
const subCategoriesRoutes = require('./sub_categories');
const serviceCategoriesRoutes = require('./service_categories');
const commonRoutes = require('./common');
const settingsRoutes = require('./settings');
const adminRoutes = require('./admin');
const userRoutes = require('./users');
const roleRoutes = require('./user_roles');
const bookingRoutes = require('./bookings');
const reviewRoutes = require('./reviews');
const testUser = require('./test_user');
const pagesRoutes = require('./pages');
const blog = require('./blog');
const contactRoutes = require('./contacts');
const baseUrl = '/api/v1'

const { authenticateToken } = require('../controllers/auth/auth_middlewares');

module.exports = (app) => {

    // Auth routes
    app.use(`${baseUrl}/auth`, authRoutes);

    // Vendor routes
    app.use(`${baseUrl}/vendors`, vendorRoutes);

    // Customer routes
    app.use(`${baseUrl}/customers`, customerRoutes);

    // Coupons routes
    app.use(`${baseUrl}/coupons`, couponsRoutes);


    // Service Routes
    app.use(`${baseUrl}/services`, serviceRoutes);

    // Categories Routes
    app.use(`${baseUrl}/categories`, categoriesRoutes);

    // Sub Categories Routes
    app.use(`${baseUrl}/subcategories`, subCategoriesRoutes);

    // Service Categories Routes
    app.use(`${baseUrl}/service_categories`, serviceCategoriesRoutes);

    // Common Routes
    app.use('/', commonRoutes);

    // Settings Routes
    app.use(`${baseUrl}/settings`, settingsRoutes);

    // Admin Routes
    app.use(`${baseUrl}/admin`, authenticateToken, adminRoutes);

    // User Routes
    app.use(`${baseUrl}/users`, authenticateToken, userRoutes);

    //Role Routes
    app.use(`${baseUrl}/user_role`, authenticateToken, roleRoutes);

    //Booking routes
    app.use(`${baseUrl}/bookings`, authenticateToken, bookingRoutes);

    //Review routes
    app.use(`${baseUrl}/reviews`, authenticateToken, reviewRoutes);

    //Test User routes
    app.use(`${baseUrl}/test_users`, testUser);

    // Page Categories Routes
    app.use(`${baseUrl}/pages`, pagesRoutes);

    // Page Blog Routes
    app.use(`${baseUrl}/blog`, blog);

    // Contact routes
    app.use(`${baseUrl}/contacts`, contactRoutes);
};
