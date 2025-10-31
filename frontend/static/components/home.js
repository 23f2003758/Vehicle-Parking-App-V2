export default {
    data() {
        return {
            features: [
                {
                    id: 1,
                    icon: 'bi bi-search',
                    title: 'Real-Time Availability',
                    description: 'See live parking spot availability in your area. No more circling around searching for a space.'
                },
                {
                    id: 2,
                    icon: 'bi bi-clock-history',
                    title: 'Save Time & Fuel',
                    description: 'Find and reserve parking in advance. Avoid the stress of last-minute parking searches.'
                },
                {
                    id: 3,
                    icon: 'bi bi-cash-coin',
                    title: 'Best Prices',
                    description: 'Compare prices across multiple parking locations and choose the option that fits your budget.'
                },
                {
                    id: 4,
                    icon: 'bi bi-credit-card',
                    title: 'Cashless Payments',
                    description: 'Pay securely through the app with UPI, cards, or wallets. No need to carry cash.'
                },
                {
                    id: 5,
                    icon: 'bi bi-bookmark-check',
                    title: 'Pre-Book Parking',
                    description: 'Reserve your spot hours or days in advance for important events, appointments, or travel.'
                },
                {
                    id: 6,
                    icon: 'bi bi-geo-alt',
                    title: 'Navigate Easily',
                    description: 'Get turn-by-turn directions to your reserved parking spot directly through the app.'
                },
                {
                    id: 7,
                    icon: 'bi bi-shield-check',
                    title: 'Verified & Secure',
                    description: 'All parking facilities are verified and equipped with proper security measures.'
                },
                {
                    id: 8,
                    icon: 'bi bi-bell',
                    title: 'Smart Reminders',
                    description: 'Get notifications for parking expiry, so you never worry about overstaying your spot.'
                },
                {
                    id: 9,
                    icon: 'bi bi-archive',
                    title: 'Parking History',
                    description: 'Track all your past bookings, payments, and favorite parking locations in one place.'
                }
            ],
            currentYear: new Date().getFullYear()
        }
    },
    template: `
    <div>
        <!-- Navigation -->
        <nav class="navbar-simple">
            <div class="navbar-brand">
                <i class="bi bi-car-front"></i>
                ESYPARK
            </div>
            <div class="navbar-links">
                <router-link to="/login" class="btn-primary-custom">
                    <i class="bi bi-box-arrow-in-right"></i> Login
                </router-link>
                <router-link to="/signup" class="btn-secondary-custom">
                    <i class="bi bi-person-plus"></i> Sign Up
                </router-link>
            </div>
        </nav>

        <!-- Hero Section -->
        <section class="hero-section fade-in">
            <h1 class="hero-title">
                <i class="bi bi-p-circle"></i> ESYPARK
            </h1>
            <p class="hero-subtitle">"Spot It. Book It. Park It."</p>
            <p style="color: #666; font-size: 1.15rem; margin-bottom: 30px; max-width: 700px; margin-left: auto; margin-right: auto;">
                Transform your parking experience with ESYPARK. Find available parking spots instantly, 
                reserve in advance, and pay seamlessly - all from your device. Say goodbye to parking stress forever.
            </p>
            <div class="hero-cta">
                <router-link to="/signup" class="btn-primary-custom">
                    <i class="bi bi-rocket-takeoff"></i> Get Started Free
                </router-link>
            </div>
        </section>

        <!-- Why Choose Us Section -->
        <section>
            <h2 class="section-title">
                <i class="bi bi-stars"></i> Why Choose ESYPARK?
            </h2>
            
            <div class="section-content" style="max-width: 900px; text-align: center; margin-bottom: 50px;">
                At ESYPARK, we take the hassle out of finding parking. Our easy-to-use platform lets you 
                discover and reserve parking spaces near your destination, saving you time, money, and stress. 
                With real-time availability, transparent pricing, and secure booking, parking has never been more convenient!
            </div>

            <div class="card-container">
                <div 
                    v-for="feature in features" 
                    :key="feature.id" 
                    class="custom-card slide-in-right"
                >
                    <h3><i :class="feature.icon"></i> {{ feature.title }}</h3>
                    <p>{{ feature.description }}</p>
                </div>
            </div>
        </section>

        <!-- Call to Action Section -->
        <section>
            <div class="hero-section" style="margin-top: 60px;">
                <h2 style="font-size: 2rem; color: #ff9800; margin-bottom: 20px;">
                    <i class="bi bi-hand-thumbs-up"></i> Ready to Experience Stress-Free Parking?
                </h2>
                <p style="color: #555; font-size: 1.1rem; margin-bottom: 30px;">
                    Join thousands of happy drivers who have already discovered the easiest way to park.
                </p>
                <router-link to="/signup" class="btn-primary-custom" style="font-size: 1.2rem; padding: 15px 40px;">
                    <i class="bi bi-arrow-right-circle"></i> Sign Up Now
                </router-link>
            </div>
        </section>

        <!-- Footer -->
        <footer class="footer">
            <div class="container-custom">
                <p>
                    <i class="bi bi-c-circle"></i> {{ currentYear }} ESYPARK. All Rights Reserved.
                </p>
                <p style="margin-top: 10px;">
                    <a href="#"><i class="bi bi-facebook"></i> Facebook</a> | 
                    <a href="#"><i class="bi bi-twitter"></i> Twitter</a> | 
                    <a href="#"><i class="bi bi-instagram"></i> Instagram</a> | 
                    <a href="#"><i class="bi bi-linkedin"></i> LinkedIn</a>
                </p>
                <p style="margin-top: 15px;">
                    <a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a>
                </p>
                <p style="margin-top: 10px; font-size: 0.9rem; color: #999;">
                    Making parking easier, one spot at a time.
                </p>
            </div>
        </footer>
    </div>
    `
}
