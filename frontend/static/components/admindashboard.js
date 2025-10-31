import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';


export default {
    setup() {
        const router = useRouter();
        
        // State management
        const parkingLots = ref([]);
        const loading = ref(false);
        const message = ref('');
        const showAlert = ref('');
        const showAddForm = ref(false);
        const showEditForm = ref(false);
        const currentLotId = ref(null);
        
        // Form data
        const lotForm = reactive({
            prime_location_name: '',
            address: '',
            pin_code: '',
            price: '',
            maximum_number_of_spots: ''
        });
        
        // Get auth token from localStorage
        const getAuthToken = () => {
            return localStorage.getItem('auth_token');
        };
        
        // Check if user is authenticated
        const checkAuth = () => {
            const token = getAuthToken();
            if (!token) {
                message.value = 'Please login to access admin dashboard';
                showAlert.value = 'error';
                setTimeout(() => {
                    router.push('/login');
                }, 2000);
                return false;
            }
            return true;
        };
        
        // Fetch all parking lots
        const fetchParkingLots = async () => {
            if (!checkAuth()) return;
            
            loading.value = true;
            try {
                const response = await fetch('/api/parking-lots', {
                    method: 'GET',
                    headers: {
                        'Authentication-Token': getAuthToken()
                    }
                });
                
                const data = await response.json();
                
                if (response.status === 200) {
                    parkingLots.value = data.data;
                } else if (response.status === 401) {
                    message.value = 'Session expired. Please login again.';
                    showAlert.value = 'error';
                    setTimeout(() => {
                        router.push('/login');
                    }, 2000);
                } else {
                    message.value = data.message || 'Failed to fetch parking lots.';
                    showAlert.value = 'error';
                }
            } catch (error) {
                message.value = 'An error occurred while fetching parking lots.';
                showAlert.value = 'error';
                console.error(error);
            } finally {
                loading.value = false;
            }
        };
        
        // Reset form
        const resetForm = () => {
            lotForm.prime_location_name = '';
            lotForm.address = '';
            lotForm.pin_code = '';
            lotForm.price = '';
            lotForm.maximum_number_of_spots = '';
        };
        
        // Show add form
        const openAddForm = () => {
            resetForm();
            showAddForm.value = true;
            showEditForm.value = false;
            message.value = '';
            showAlert.value = '';
        };
        
        // Close forms
        const closeForms = () => {
            showAddForm.value = false;
            showEditForm.value = false;
            resetForm();
            message.value = '';
            showAlert.value = '';
        };
        
        // Validate form - FIXED VERSION
        const validateForm = () => {
            // Convert to string and trim for validation
            const locationName = String(lotForm.prime_location_name || '').trim();
            const address = String(lotForm.address || '').trim();
            const pinCode = String(lotForm.pin_code || '').trim();
            const price = lotForm.price;
            const maxSpots = lotForm.maximum_number_of_spots;
            
            if (!locationName) {
                message.value = 'Location name is required!';
                showAlert.value = 'error';
                return false;
            }
            
            if (!address) {
                message.value = 'Address is required!';
                showAlert.value = 'error';
                return false;
            }
            
            if (!pinCode) {
                message.value = 'Pin code is required!';
                showAlert.value = 'error';
                return false;
            }
            
            if (pinCode.length !== 6) {
                message.value = 'Pin code must be exactly 6 digits!';
                showAlert.value = 'error';
                return false;
            }
            
            if (!price || parseInt(price) <= 0) {
                message.value = 'Price must be greater than 0!';
                showAlert.value = 'error';
                return false;
            }
            
            if (!maxSpots || parseInt(maxSpots) <= 0) {
                message.value = 'Maximum spots must be greater than 0!';
                showAlert.value = 'error';
                return false;
            }
            
            return true;
        };
        
        // Add new parking lot
        const addParkingLot = async (event) => {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            console.log('Add parking lot called');
            
            if (!validateForm()) return;
            
            loading.value = true;
            try {
                const response = await fetch('/api/parking-lots', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authentication-Token': getAuthToken()
                    },
                    body: JSON.stringify(lotForm)
                });
                
                const data = await response.json();
                
                if (response.status === 201) {
                    message.value = 'Parking lot added successfully!';
                    showAlert.value = 'success';
                    closeForms();
                    await fetchParkingLots();
                    
                    setTimeout(() => {
                        message.value = '';
                        showAlert.value = '';
                    }, 3000);
                } else {
                    message.value = data.message || 'Failed to add parking lot.';
                    showAlert.value = 'error';
                }
            } catch (error) {
                message.value = 'An error occurred while adding parking lot.';
                showAlert.value = 'error';
                console.error(error);
            } finally {
                loading.value = false;
            }
        };
        
        // Open edit form - FIXED VERSION
        const openEditForm = (lot) => {
            console.log('Opening edit form for:', lot);
            currentLotId.value = lot.id;
            // Convert all values to strings to avoid trim() errors
            lotForm.prime_location_name = String(lot.prime_location_name);
            lotForm.address = String(lot.address);
            lotForm.pin_code = String(lot.pin_code);
            lotForm.price = String(lot.price);
            lotForm.maximum_number_of_spots = String(lot.maximum_number_of_spots);
            
            showEditForm.value = true;
            showAddForm.value = false;
            message.value = '';
            showAlert.value = '';
        };
        
        // Update parking lot
        const updateParkingLot = async (event) => {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            console.log('Update parking lot called');
            
            if (!validateForm()) return;
            
            loading.value = true;
            try {
                const response = await fetch(`/api/parking-lots/${currentLotId.value}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authentication-Token': getAuthToken()
                    },
                    body: JSON.stringify(lotForm)
                });
                
                const data = await response.json();
                
                if (response.status === 200) {
                    message.value = 'Parking lot updated successfully!';
                    showAlert.value = 'success';
                    closeForms();
                    await fetchParkingLots();
                    
                    setTimeout(() => {
                        message.value = '';
                        showAlert.value = '';
                    }, 3000);
                } else {
                    message.value = data.message || 'Failed to update parking lot.';
                    showAlert.value = 'error';
                }
            } catch (error) {
                message.value = 'An error occurred while updating parking lot.';
                showAlert.value = 'error';
                console.error(error);
            } finally {
                loading.value = false;
            }
        };
        
        // Delete parking lot
        const deleteParkingLot = async (lotId, lotName) => {
            if (!confirm(`Are you sure you want to delete "${lotName}"? This action cannot be undone.`)) {
                return;
            }
            
            loading.value = true;
            try {
                const response = await fetch(`/api/parking-lots/${lotId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authentication-Token': getAuthToken()
                    }
                });
                
                const data = await response.json();
                
                if (response.status === 200) {
                    message.value = 'Parking lot deleted successfully!';
                    showAlert.value = 'success';
                    await fetchParkingLots();
                    
                    setTimeout(() => {
                        message.value = '';
                        showAlert.value = '';
                    }, 3000);
                } else {
                    message.value = data.message || 'Failed to delete parking lot.';
                    showAlert.value = 'error';
                }
            } catch (error) {
                message.value = 'An error occurred while deleting parking lot.';
                showAlert.value = 'error';
                console.error(error);
            } finally {
                loading.value = false;
            }
        };
        
        // View parking lot details
        const viewParkingLot = (lotId) => {
            console.log('Viewing lot:', lotId);
            router.push(`/view-lot/${lotId}`);
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
        
        // Fetch parking lots on component mount
        onMounted(() => {
            fetchParkingLots();
        });
        
        return {
            parkingLots,
            loading,
            message,
            showAlert,
            showAddForm,
            showEditForm,
            lotForm,
            openAddForm,
            closeForms,
            addParkingLot,
            openEditForm,
            updateParkingLot,
            deleteParkingLot,
            viewParkingLot,
            logout
        };
    },
    
    template: `
        <div>
            <!-- Navigation Bar -->
            <nav class="navbar-simple">
                <a href="/" class="navbar-brand">
                    <i class="bi bi-car-front"></i>
                    EASYPARK
                </a>
                <div class="navbar-links">
                    <a href="#/admindashboard">Dashboard</a>
                    <a href="#/users">Users</a>
                    <a href="#/adminsummary">Summary</a>
                    <a href="#" @click.prevent="logout">Logout</a>
                </div>

            </nav>


            <!-- Alert Messages -->
            <div v-if="message" :class="['alert-custom', showAlert === 'success' ? 'alert-success' : 'alert-error']">
                {{ message }}
            </div>


            <!-- Page Title -->
            <h1 class="section-title">Admin Dashboard - Parking Lot Management</h1>


            <!-- Loading Spinner -->
            <div v-if="loading" class="spinner"></div>


            <!-- Main Content -->
            <div v-else class="container-custom">
                
                <!-- Add Parking Lot Button -->
                <div class="text-center mt-3 mb-4">
                    <button @click.prevent="openAddForm" class="btn-primary-custom" type="button">
                        <i class="bi bi-plus-circle"></i> Add New Parking Lot
                    </button>
                </div>


                <!-- Add Form -->
                <div v-if="showAddForm" class="form-container fade-in" @click.stop>
                    <h2 class="form-title">Add New Parking Lot</h2>
                    
                    <div class="form-group">
                        <label class="form-label">Location Name</label>
                        <input 
                            type="text" 
                            v-model="lotForm.prime_location_name"
                            class="form-control"
                            placeholder="Enter location name"
                        />
                    </div>


                    <div class="form-group">
                        <label class="form-label">Address</label>
                        <input 
                            type="text" 
                            v-model="lotForm.address"
                            class="form-control"
                            placeholder="Enter address"
                        />
                    </div>


                    <div class="form-group">
                        <label class="form-label">Pin Code</label>
                        <input 
                            type="text" 
                            v-model="lotForm.pin_code"
                            class="form-control"
                            placeholder="Enter 6-digit pin code"
                            maxlength="6"
                        />
                    </div>


                    <div class="form-group">
                        <label class="form-label">Price (per hour)</label>
                        <input 
                            type="number" 
                            v-model="lotForm.price"
                            class="form-control"
                            placeholder="Enter price"
                            min="1"
                        />
                    </div>


                    <div class="form-group">
                        <label class="form-label">Maximum Parking Spots</label>
                        <input 
                            type="number" 
                            v-model="lotForm.maximum_number_of_spots"
                            class="form-control"
                            placeholder="Enter maximum spots"
                            min="1"
                        />
                    </div>


                    <div style="display: flex; gap: 15px; justify-content: center; margin-top: 30px;">
                        <button @click.prevent.stop="addParkingLot" class="btn-primary-custom" type="button">Add Parking Lot</button>
                        <button @click.prevent.stop="closeForms" class="btn-secondary-custom" type="button">Cancel</button>
                    </div>
                </div>


                <!-- Edit Form -->
                <div v-if="showEditForm" class="form-container fade-in" @click.stop>
                    <h2 class="form-title">Edit Parking Lot</h2>
                    
                    <div class="form-group">
                        <label class="form-label">Location Name</label>
                        <input 
                            type="text" 
                            v-model="lotForm.prime_location_name"
                            class="form-control"
                            placeholder="Enter location name"
                        />
                    </div>


                    <div class="form-group">
                        <label class="form-label">Address</label>
                        <input 
                            type="text" 
                            v-model="lotForm.address"
                            class="form-control"
                            placeholder="Enter address"
                        />
                    </div>


                    <div class="form-group">
                        <label class="form-label">Pin Code</label>
                        <input 
                            type="text" 
                            v-model="lotForm.pin_code"
                            class="form-control"
                            placeholder="Enter 6-digit pin code"
                            maxlength="6"
                        />
                    </div>


                    <div class="form-group">
                        <label class="form-label">Price (per hour)</label>
                        <input 
                            type="number" 
                            v-model="lotForm.price"
                            class="form-control"
                            placeholder="Enter price"
                            min="1"
                        />
                    </div>


                    <div class="form-group">
                        <label class="form-label">Maximum Parking Spots</label>
                        <input 
                            type="number" 
                            v-model="lotForm.maximum_number_of_spots"
                            class="form-control"
                            placeholder="Enter maximum spots"
                            min="1"
                        />
                    </div>


                    <div style="display: flex; gap: 15px; justify-content: center; margin-top: 30px;">
                        <button @click.prevent.stop="updateParkingLot" class="btn-primary-custom" type="button">Update Parking Lot</button>
                        <button @click.prevent.stop="closeForms" class="btn-secondary-custom" type="button">Cancel</button>
                    </div>
                </div>


                <!-- Parking Lots Table -->
                <div v-if="!showAddForm && !showEditForm" class="table-container fade-in">
                    <h2 class="form-title mb-3">All Parking Lots</h2>
                    
                    <div v-if="parkingLots.length === 0" class="text-center py-4">
                        <p style="font-size: 1.2rem; color: #666;">No parking lots available. Add one to get started!</p>
                    </div>


                    <table v-else class="custom-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Location Name</th>
                                <th>Address</th>
                                <th>Pin Code</th>
                                <th>Price/Hour</th>
                                <th>Max Spots</th>
                                <th>Available</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="lot in parkingLots" :key="lot.id">
                                <td>{{ lot.id }}</td>
                                <td>{{ lot.prime_location_name }}</td>
                                <td>{{ lot.address }}</td>
                                <td>{{ lot.pin_code }}</td>
                                <td>₹{{ lot.price }}</td>
                                <td>{{ lot.maximum_number_of_spots }}</td>
                                <td>{{ lot.available_spots }}</td>
                                <td>
                                    <button 
                                        @click.prevent.stop="viewParkingLot(lot.id)" 
                                        class="btn-secondary-custom"
                                        type="button"
                                        style="padding: 8px 16px; font-size: 0.9rem; margin-right: 8px;"
                                    >
                                        View
                                    </button>
                                    <button 
                                        @click.prevent.stop="openEditForm(lot)" 
                                        class="btn-primary-custom"
                                        type="button"
                                        style="padding: 8px 16px; font-size: 0.9rem; margin-right: 8px;"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        @click.prevent.stop="deleteParkingLot(lot.id, lot.prime_location_name)" 
                                        class="btn-primary-custom"
                                        type="button"
                                        style="padding: 8px 16px; font-size: 0.9rem; background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>


            </div>


            <!-- Footer -->
            <footer class="footer mt-5">
                <p>&copy; 2025 EASYPARK. All rights reserved.</p>
            </footer>
        </div>
    `
};
