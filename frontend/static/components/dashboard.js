import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';


export default {
    setup() {
        const router = useRouter();
        
        const user = ref({});
        const bookings = ref([]);
        const parkingLots = ref([]);
        const loading = ref(false);
        const message = ref('');
        const showAlert = ref('');
        const showBookingModal = ref(false);
        const showReleaseModal = ref(false);
        const selectedLot = ref(null);
        const selectedBooking = ref(null);
        const releasePreview = ref(null);
        const vehicleNumber = ref('');
        
        // Get auth token from localStorage
        const getAuthToken = () => {
            return localStorage.getItem('auth_token');
        };
        
        // Check authentication
        const checkAuth = () => {
            const token = getAuthToken();
            if (!token) {
                message.value = 'Please login to access dashboard';
                showAlert.value = 'error';
                setTimeout(() => {
                    router.push('/login');
                }, 2000);
                return false;
            }
            return true;
        };
        
        // Computed statistics
        const stats = computed(() => {
            const totalBookings = bookings.value.length;
            const activeBookings = bookings.value.filter(b => b.status === 'active').length;
            const totalSpent = bookings.value.reduce((sum, b) => sum + (b.total_cost || 0), 0);
            
            return {
                totalBookings,
                activeBookings,
                totalSpent: totalSpent.toFixed(2)
            };
        });
        
        // Fetch dashboard data
        const fetchDashboardData = async () => {
            if (!checkAuth()) return;
            
            loading.value = true;
            try {
                const response = await fetch('/api/user/dashboard', {
                    method: 'GET',
                    headers: {
                        'Authentication-Token': getAuthToken()
                    }
                });
                
                const data = await response.json();
                
                if (response.status === 200) {
                    user.value = data.data.user;
                    bookings.value = data.data.bookings;
                    parkingLots.value = data.data.parking_lots;
                } else if (response.status === 401) {
                    message.value = 'Session expired. Please login again.';
                    showAlert.value = 'error';
                    setTimeout(() => {
                        router.push('/login');
                    }, 2000);
                } else {
                    message.value = data.message || 'Failed to fetch dashboard data.';
                    showAlert.value = 'error';
                }
            } catch (error) {
                message.value = 'An error occurred while fetching data.';
                showAlert.value = 'error';
                console.error(error);
            } finally {
                loading.value = false;
            }
        };
        
        // Open booking modal
        const openBookingModal = (lot) => {
            if (lot.available_spots === 0) {
                message.value = 'No spots available in this parking lot.';
                showAlert.value = 'error';
                return;
            }
            selectedLot.value = lot;
            showBookingModal.value = true;
            vehicleNumber.value = '';
            message.value = '';
        };
        
        // Close booking modal
        const closeBookingModal = () => {
            showBookingModal.value = false;
            selectedLot.value = null;
            vehicleNumber.value = '';
        };
        
        // Book parking spot
        const bookParkingSpot = async () => {
            if (!vehicleNumber.value || vehicleNumber.value.trim() === '') {
                message.value = 'Vehicle number is required!';
                showAlert.value = 'error';
                return;
            }
            
            loading.value = true;
            try {
                const response = await fetch('/api/booking', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authentication-Token': getAuthToken()
                    },
                    body: JSON.stringify({
                        lot_id: selectedLot.value.id,
                        vehicle_number: vehicleNumber.value
                    })
                });
                
                const data = await response.json();
                
                if (response.status === 201) {
                    message.value = 'Parking spot booked successfully!';
                    showAlert.value = 'success';
                    closeBookingModal();
                    await fetchDashboardData();
                    
                    setTimeout(() => {
                        message.value = '';
                        showAlert.value = '';
                    }, 3000);
                } else {
                    message.value = data.message || 'Failed to book parking spot.';
                    showAlert.value = 'error';
                }
            } catch (error) {
                message.value = 'An error occurred while booking.';
                showAlert.value = 'error';
                console.error(error);
            } finally {
                loading.value = false;
            }
        };
        
        // Open release preview modal - FIXED
        const openReleaseModal = async (booking) => {
            console.log('Opening release modal for booking:', booking);
            selectedBooking.value = booking;
            
            try {
                const response = await fetch(`/api/booking/${booking.id}/release`, {
                    method: 'GET',
                    headers: {
                        'Authentication-Token': getAuthToken()
                    }
                });
                
                const data = await response.json();
                console.log('Release preview response:', data);
                
                if (response.status === 200) {
                    releasePreview.value = data.data;
                    showReleaseModal.value = true;
                    console.log('Modal should show now');
                } else {
                    message.value = data.message || 'Failed to load release preview.';
                    showAlert.value = 'error';
                }
            } catch (error) {
                message.value = 'An error occurred.';
                showAlert.value = 'error';
                console.error('Release preview error:', error);
            }
        };
        
        // Close release modal
        const closeReleaseModal = () => {
            showReleaseModal.value = false;
            selectedBooking.value = null;
            releasePreview.value = null;
        };
        
        // Release parking spot (Pay Now button)
        const releaseParkingSpot = async () => {
            loading.value = true;
            try {
                const response = await fetch(`/api/booking/${selectedBooking.value.id}/release`, {
                    method: 'POST',
                    headers: {
                        'Authentication-Token': getAuthToken()
                    }
                });
                
                const data = await response.json();
                
                if (response.status === 200) {
                    message.value = `Payment successful! Total cost: ₹${data.data.total_cost}`;
                    showAlert.value = 'success';
                    closeReleaseModal();
                    await fetchDashboardData();
                    
                    setTimeout(() => {
                        message.value = '';
                        showAlert.value = '';
                    }, 5000);
                } else {
                    message.value = data.message || 'Failed to release parking spot.';
                    showAlert.value = 'error';
                }
            } catch (error) {
                message.value = 'An error occurred while releasing spot.';
                showAlert.value = 'error';
                console.error(error);
            } finally {
                loading.value = false;
            }
        };
        
        // Format date
        const formatDate = (dateString) => {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            return date.toLocaleString();
        };
        
        // Calculate duration in readable format
        const formatDuration = (seconds) => {
            if (!seconds) return 'N/A';
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            
            if (hours > 0) {
                return `${hours}h ${minutes}m ${secs}s`;
            } else if (minutes > 0) {
                return `${minutes}m ${secs}s`;
            } else {
                return `${secs}s`;
            }
        };
        
        // Logout
        const logout = async () => {
            try {
                await fetch('/api/logout', {
                    method: 'POST',
                    headers: {
                        'Authentication-Token': getAuthToken()
                    }
                });
                
                localStorage.removeItem('auth_token');
                router.push('/login');
            } catch (error) {
                console.error(error);
                localStorage.removeItem('auth_token');
                router.push('/login');
            }
        };
        
        // Fetch data on mount
        onMounted(() => {
            fetchDashboardData();
        });
        
        return {
            user,
            bookings,
            parkingLots,
            loading,
            message,
            showAlert,
            showBookingModal,
            showReleaseModal,
            selectedLot,
            selectedBooking,
            releasePreview,
            vehicleNumber,
            stats,
            openBookingModal,
            closeBookingModal,
            bookParkingSpot,
            openReleaseModal,
            closeReleaseModal,
            releaseParkingSpot,
            formatDate,
            formatDuration,
            logout
        };
    },
    
    template: `
        <div>
            <!-- Navigation -->
            <nav class="navbar-simple">
                <a href="/" class="navbar-brand">
                    <i class="bi bi-car-front"></i>
                    EASYPARK
                </a>
                <div class="navbar-links">
                    <span style="color: #222; font-weight: 500;">
                        <i class="bi bi-person-circle"></i> {{ user.username || 'User' }}
                    </span>
                    <a href="#/dashboard">Dashboard</a>
                    <a href="#/summary">Summary</a>
                    <a href="#" @click.prevent="logout">Logout</a>
                </div>
            </nav>


            <!-- Alert Messages -->
            <div v-if="message" :class="['alert-custom', showAlert === 'success' ? 'alert-success' : 'alert-error']">
                {{ message }}
            </div>


            <!-- Dashboard Header -->
            <h1 class="section-title">
                <i class="bi bi-speedometer2"></i> Welcome, {{ user.username || 'User' }}!
            </h1>


            <!-- Loading Spinner -->
            <div v-if="loading && !showReleaseModal && !showBookingModal" class="spinner"></div>


            <!-- Main Content -->
            <div v-else class="container-custom">
                
                <!-- Statistics Cards -->
                <div class="card-container">
                    <div class="custom-card text-center">
                        <h3 style="font-size: 2.5rem; margin-bottom: 10px; color: #ff9800;">
                            {{ stats.totalBookings }}
                        </h3>
                        <p style="font-size: 1.1rem; color: #555;">
                            <i class="bi bi-calendar-check"></i> Total Bookings
                        </p>
                    </div>
                    <div class="custom-card text-center">
                        <h3 style="font-size: 2.5rem; margin-bottom: 10px; color: #4caf50;">
                            {{ stats.activeBookings }}
                        </h3>
                        <p style="font-size: 1.1rem; color: #555;">
                            <i class="bi bi-clock-history"></i> Active Bookings
                        </p>
                    </div>
                    <div class="custom-card text-center">
                        <h3 style="font-size: 2.5rem; margin-bottom: 10px; color: #2196f3;">
                            ₹{{ stats.totalSpent }}
                        </h3>
                        <p style="font-size: 1.1rem; color: #555;">
                            <i class="bi bi-wallet2"></i> Total Spent
                        </p>
                    </div>
                </div>


                <!-- Available Parking Lots -->
                <h2 class="section-title">
                    <i class="bi bi-p-square"></i> Available Parking Lots
                </h2>


                <div class="card-container">
                    <div v-if="parkingLots.length === 0" class="section-content text-center">
                        <p>No parking lots available at the moment.</p>
                    </div>


                    <div v-for="lot in parkingLots" :key="lot.id" class="custom-card">
                        <h3><i class="bi bi-geo-alt-fill"></i> {{ lot.prime_location_name }}</h3>
                        <p><strong>Address:</strong> {{ lot.address }}</p>
                        <p><strong>Pin Code:</strong> {{ lot.pin_code }}</p>
                        <p><strong>Price:</strong> ₹{{ lot.price }}/hour</p>
                        <p>
                            <strong>Available Spots:</strong> 
                            <span :style="{ color: lot.available_spots > 0 ? '#4caf50' : '#f44336', fontWeight: '600' }">
                                {{ lot.available_spots }} / {{ lot.maximum_number_of_spots }}
                            </span>
                        </p>
                        <button 
                            @click="openBookingModal(lot)" 
                            :disabled="lot.available_spots === 0"
                            :class="lot.available_spots > 0 ? 'btn-primary-custom' : 'btn-secondary-custom'"
                            type="button"
                            style="width: 100%; margin-top: 10px;"
                            :style="{ opacity: lot.available_spots === 0 ? 0.5 : 1, cursor: lot.available_spots === 0 ? 'not-allowed' : 'pointer' }"
                        >
                            <i :class="lot.available_spots > 0 ? 'bi bi-bookmark-plus' : 'bi bi-x-circle'"></i>
                            {{ lot.available_spots > 0 ? 'Book Now' : 'Fully Booked' }}
                        </button>
                    </div>
                </div>


                <!-- My Bookings -->
                <h2 class="section-title">
                    <i class="bi bi-list-check"></i> My Bookings
                </h2>


                <div class="table-container">
                    <table v-if="bookings.length > 0" class="custom-table">
                        <thead>
                            <tr>
                                <th>Booking ID</th>
                                <th>Lot Name</th>
                                <th>Spot #</th>
                                <th>Vehicle</th>
                                <th>Start Time</th>
                                <th>End Time</th>
                                <th>Cost</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="booking in bookings" :key="booking.id">
                                <td>#{{ booking.id }}</td>
                                <td>{{ booking.lot_name }}</td>
                                <td>{{ booking.spot_number }}</td>
                                <td>{{ booking.vehicle_number }}</td>
                                <td>{{ formatDate(booking.parking_time) }}</td>
                                <td>{{ booking.leaving_time ? formatDate(booking.leaving_time) : 'Active' }}</td>
                                <td>₹{{ booking.total_cost || 'Ongoing' }}</td>
                                <td>
                                    <span :style="{ 
                                        color: booking.status === 'active' ? '#4caf50' : '#2196f3',
                                        fontWeight: '600',
                                        textTransform: 'uppercase'
                                    }">
                                        {{ booking.status }}
                                    </span>
                                </td>
                                <td>
                                    <button 
                                        v-if="booking.status === 'active'"
                                        @click.prevent.stop="openReleaseModal(booking)"
                                        class="btn-primary-custom"
                                        type="button"
                                        style="padding: 6px 12px; font-size: 0.9rem; background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);"
                                    >
                                        Release
                                    </button>
                                    <span v-else style="color: #999;">Completed</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div v-else class="section-content text-center">
                        <p style="font-size: 1.2rem; color: #666;">You don't have any bookings yet.</p>
                        <p>Book a parking spot to get started!</p>
                    </div>
                </div>


            </div>


            <!-- Booking Modal -->
            <div v-if="showBookingModal" 
                style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
                background: rgba(0,0,0,0.6); z-index: 2000; display: flex; 
                align-items: center; justify-content: center;"
                @click.self="closeBookingModal">
                <div class="form-container fade-in" style="margin: 20px; max-width: 500px;">
                    <h2 class="form-title">
                        <i class="bi bi-bookmark-plus"></i> Book Parking Spot
                    </h2>


                    <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <p><strong>Location:</strong> {{ selectedLot.prime_location_name }}</p>
                        <p><strong>Address:</strong> {{ selectedLot.address }}</p>
                        <p><strong>Price:</strong> ₹{{ selectedLot.price }}/hour</p>
                        <p><strong>Available Spots:</strong> {{ selectedLot.available_spots }}</p>
                    </div>


                    <div class="form-group">
                        <label class="form-label">
                            <i class="bi bi-car-front"></i> Vehicle Number
                        </label>
                        <input 
                            type="text" 
                            v-model="vehicleNumber"
                            class="form-control" 
                            placeholder="e.g., MH12AB1234"
                            @keyup.enter="bookParkingSpot"
                        />
                    </div>


                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button @click="bookParkingSpot" class="btn-primary-custom" type="button" style="flex: 1;">
                            <i class="bi bi-check-circle"></i> Confirm Booking
                        </button>
                        <button @click="closeBookingModal" class="btn-secondary-custom" type="button" style="flex: 1;">
                            <i class="bi bi-x-circle"></i> Cancel
                        </button>
                    </div>
                </div>
            </div>


            <!-- Release Preview Modal -->
            <div v-if="showReleaseModal && releasePreview" 
                style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
                background: rgba(0,0,0,0.6); z-index: 2000; display: flex; 
                align-items: center; justify-content: center; overflow-y: auto; padding: 20px;"
                @click.self="closeReleaseModal">
                <div class="form-container fade-in" style="margin: 20px auto; max-width: 600px;">
                    <h2 class="form-title">
                        <i class="bi bi-cash-coin"></i> Release Parking Spot
                    </h2>


                    <!-- Booking Summary Table -->
                    <div style="background: #f5f5f5; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                        <h3 style="color: #ff9800; margin-bottom: 15px; font-size: 1.2rem;">
                            <i class="bi bi-receipt"></i> Booking Summary
                        </h3>
                        
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 12px 0; font-weight: 600; color: #555;">Booking ID:</td>
                                <td style="padding: 12px 0; text-align: right;">#{{ releasePreview.booking_id }}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 12px 0; font-weight: 600; color: #555;">Vehicle Number:</td>
                                <td style="padding: 12px 0; text-align: right; font-weight: 600;">{{ releasePreview.vehicle_number }}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 12px 0; font-weight: 600; color: #555;">Parking Time:</td>
                                <td style="padding: 12px 0; text-align: right;">{{ formatDate(releasePreview.parking_time) }}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 12px 0; font-weight: 600; color: #555;">Leaving Time:</td>
                                <td style="padding: 12px 0; text-align: right;">{{ formatDate(releasePreview.leaving_time) }}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 12px 0; font-weight: 600; color: #555;">Duration:</td>
                                <td style="padding: 12px 0; text-align: right; color: #ff9800; font-weight: 600;">
                                    {{ formatDuration(releasePreview.total_duration_seconds) }}
                                </td>
                            </tr>
                            <tr style="border-bottom: 1px solid #ddd;">
                                <td style="padding: 12px 0; font-weight: 600; color: #555;">Rate:</td>
                                <td style="padding: 12px 0; text-align: right;">₹{{ releasePreview.cost_per_hour }}/hour</td>
                            </tr>
                            <tr style="border-bottom: 2px solid #ff9800;">
                                <td style="padding: 15px 0; font-weight: 700; color: #333; font-size: 1.1rem;">Total Amount:</td>
                                <td style="padding: 15px 0; text-align: right; color: #ff9800; font-weight: 700; font-size: 1.5rem;">
                                    ₹{{ releasePreview.total_cost }}
                                </td>
                            </tr>
                        </table>
                    </div>


                    <!-- Payment Note -->
                    <div style="background: rgba(255, 152, 0, 0.1); padding: 15px; border-radius: 8px; border-left: 4px solid #ff9800; margin-bottom: 20px;">
                        <p style="margin: 0; color: #333;">
                            <i class="bi bi-info-circle" style="color: #ff9800;"></i>
                            <strong>Note:</strong> Clicking "Pay Now" will release your parking spot and process the payment.
                        </p>
                    </div>


                    <!-- Action Buttons -->
                    <div style="display: flex; gap: 10px;">
                        <button 
                            @click="releaseParkingSpot" 
                            class="btn-primary-custom" 
                            type="button"
                            style="flex: 1; background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);"
                        >
                            <i class="bi bi-credit-card"></i> Pay Now (₹{{ releasePreview.total_cost }})
                        </button>
                        <button 
                            @click="closeReleaseModal" 
                            class="btn-secondary-custom" 
                            type="button"
                            style="flex: 1;"
                        >
                            <i class="bi bi-x-circle"></i> Cancel
                        </button>
                    </div>
                </div>
            </div>


            <!-- Footer -->
            <footer class="footer mt-5">
                <p>&copy; 2025 EASYPARK. All rights reserved.</p>
            </footer>
        </div>
    `
};
