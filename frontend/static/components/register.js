import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';

export default {
    setup() {
        const router = useRouter();
        
        const message = ref('');
        const showAlert = ref('');
        const confirmPassword = ref('');
        
        const user = reactive({
            username: '',
            email: '',
            password: '',
            address: '',
            pin_code: ''
        });
        
        const goToLogin = () => {
            router.push('/login');
        };
        
        const validateForm = () => {
            // Check if all fields are filled
            if (!user.username.trim()) {
                message.value = 'Username is required!';
                showAlert.value = 'error';
                return false;
            }
            
            if (!user.email.trim()) {
                message.value = 'Email is required!';
                showAlert.value = 'error';
                return false;
            }
            
            if (!user.password.trim()) {
                message.value = 'Password is required!';
                showAlert.value = 'error';
                return false;
            }
            
            if (!user.address.trim()) {
                message.value = 'Address is required!';
                showAlert.value = 'error';
                return false;
            }
            
            if (!user.pin_code.trim()) {
                message.value = 'Pin code is required!';
                showAlert.value = 'error';
                return false;
            }
            
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(user.email)) {
                message.value = 'Please enter a valid email address';
                showAlert.value = 'error';
                return false;
            }
            
            // Check if password is only spaces
            if (user.password.trim() === '') {
                message.value = 'Password cannot be empty.';
                showAlert.value = 'error';
                return false;
            }
            
            // Check if passwords match
            if (user.password !== confirmPassword.value) {
                message.value = 'Passwords do not match!';
                showAlert.value = 'error';
                return false;
            }
            
            // Validate pin code (must be exactly 6 characters)
            if (user.pin_code.length !== 6) {
                message.value = 'PinCode must be exactly 6 characters long.';
                showAlert.value = 'error';
                return false;
            }
            
            // Check if address is only spaces
            if (user.address.trim() === '') {
                message.value = 'Address cannot be empty.';
                showAlert.value = 'error';
                return false;
            }
            
            return true;
        };
        
        const registerUser = async () => {
            // Validate form before submission
            if (!validateForm()) {
                return;
            }
            
            try {
                const response = await fetch('/api/register', {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(user)
                });
                
                const data = await response.json();
                console.log(data);
                
                if (response.status === 201) {
                    // Success (201 Created)
                    message.value = 'Registration successful! Redirecting to login...';
                    showAlert.value = 'success';
                    
                    // Redirect to login after 2 seconds
                    setTimeout(() => {
                        router.push('/login');
                    }, 1000);
                } else if (response.status === 409) {
                    // User already exists
                    message.value = data.message || 'User already exists.';
                    showAlert.value = 'error';
                } else if (response.status === 400) {
                    // Bad request (validation errors)
                    message.value = data.message || 'Registration failed. Please check your inputs.';
                    showAlert.value = 'error';
                } else {
                    // Other errors
                    message.value = data.message || 'Registration failed. Please try again.';
                    showAlert.value = 'error';
                }
            } catch (error) {
                message.value = 'An error occurred. Please try again.';
                showAlert.value = 'error';
                console.error(error);
            }
        };
        
        // Return everything that needs to be available in the template
        return {
            message,
            showAlert,
            user,
            confirmPassword,
            goToLogin,
            validateForm,
            registerUser
        };
    },


    template: `
    <div>
        <!-- Navigation -->
        <nav class="navbar-simple">
            <router-link to="/" class="navbar-brand">
                <i class="bi bi-car-front"></i>
                ESYPARK
            </router-link>
            <div class="navbar-links">
                <router-link to="/" class="nav-link">Home</router-link>
                <router-link to="/login" class="nav-link">Login</router-link>
                <router-link to="/signup" class="nav-link">Sign Up</router-link>
            </div>
        </nav>

        <!-- Registration Form Container -->
        <div class="form-container fade-in" style="max-width: 600px;">
            <h2 class="form-title">
                <i class="bi bi-person-plus"></i> Create Account
            </h2>
            
            <p style="text-align: center; color: #666; margin-bottom: 30px;">
                Join ESYPARK today and experience hassle-free parking!
            </p>

            <!-- Alert Messages -->
            <div v-if="message && showAlert === 'error'" class="alert-custom alert-error">
                <i class="bi bi-exclamation-triangle"></i>
                {{ message }}
            </div>
            
            <div v-if="showAlert === 'success'" class="alert-custom alert-success">
                <i class="bi bi-check-circle"></i>
                {{ message }}
            </div>

            <form @submit.prevent="registerUser">
                <!-- Username Input -->
                <div class="form-group">
                    <label class="form-label" for="username">
                        <i class="bi bi-person"></i> Username <span style="color: #f44336;">*</span>
                    </label>
                    <input 
                        type="text" 
                        id="username" 
                        v-model="user.username"
                        class="form-control" 
                        placeholder="Enter your username"
                        maxlength="100"
                        required
                    >
                </div>

                <!-- Email Input -->
                <div class="form-group">
                    <label class="form-label" for="email">
                        <i class="bi bi-envelope"></i> Email Address <span style="color: #f44336;">*</span>
                    </label>
                    <input 
                        type="email" 
                        id="email" 
                        v-model="user.email"
                        class="form-control" 
                        placeholder="your@email.com"
                        maxlength="150"
                        required
                    >
                    <small style="color: #666; font-size: 0.875rem; display: block; margin-top: 5px;">
                        We'll never share your email with anyone else.
                    </small>
                </div>

                <!-- Password Input -->
                <div class="form-group">
                    <label class="form-label" for="password">
                        <i class="bi bi-lock"></i> Password <span style="color: #f44336;">*</span>
                    </label>
                    <input 
                        type="password" 
                        id="password" 
                        v-model="user.password"
                        class="form-control" 
                        placeholder="Create a strong password"
                        maxlength="20"
                        required
                    >
                </div>

                <!-- Confirm Password Input -->
                <div class="form-group">
                    <label class="form-label" for="confirmPassword">
                        <i class="bi bi-lock-fill"></i> Confirm Password <span style="color: #f44336;">*</span>
                    </label>
                    <input 
                        type="password" 
                        id="confirmPassword" 
                        v-model="confirmPassword"
                        class="form-control" 
                        placeholder="Re-enter your password"
                        maxlength="20"
                        required
                    >
                </div>

                <!-- Address Input -->
                <div class="form-group">
                    <label class="form-label" for="address">
                        <i class="bi bi-geo-alt"></i> Address <span style="color: #f44336;">*</span>
                    </label>
                    <textarea 
                        id="address" 
                        v-model="user.address"
                        class="form-control" 
                        placeholder="Enter your full address"
                        rows="3"
                        maxlength="200"
                        required
                    ></textarea>
                </div>

                <!-- Pin Code Input -->
                <div class="form-group">
                    <label class="form-label" for="pin_code">
                        <i class="bi bi-mailbox"></i> Pin Code <span style="color: #f44336;">*</span>
                    </label>
                    <input 
                        type="text" 
                        id="pin_code" 
                        v-model="user.pin_code"
                        class="form-control" 
                        placeholder="Enter 6-digit pin code"
                        maxlength="10"
                        required
                    >
                    <small style="color: #666; font-size: 0.875rem; display: block; margin-top: 5px;">
                        Pin code must be exactly 6 characters long.
                    </small>
                </div>

                <!-- Terms and Conditions -->
                <div class="form-group" style="margin-bottom: 20px;">
                    <label style="display: flex; align-items: flex-start; gap: 8px; cursor: pointer;">
                        <input 
                            type="checkbox" 
                            style="width: 18px; height: 18px; cursor: pointer; margin-top: 3px;"
                            required
                        >
                        <span style="color: #555; font-size: 0.95rem;">
                            I agree to the <a href="#" style="color: #ff9800; text-decoration: none;">Terms of Service</a> 
                            and <a href="#" style="color: #ff9800; text-decoration: none;">Privacy Policy</a>
                        </span>
                    </label>
                </div>

                <!-- Register Button -->
                <button 
                    type="submit" 
                    class="btn-primary-custom" 
                    style="width: 100%; margin-bottom: 20px;"
                >
                    <i class="bi bi-person-check"></i> Create Account
                </button>

                <!-- Divider -->
                <div style="text-align: center; margin: 20px 0; color: #999;">
                    <span style="position: relative;">
                        <span style="background: rgba(255, 255, 255, 0.97); padding: 0 10px; position: relative; z-index: 1;">
                            Already have an account?
                        </span>
                        <hr style="position: absolute; top: 50%; left: 0; right: 0; margin: 0; border: none; border-top: 1px solid #ddd; z-index: 0;">
                    </span>
                </div>

                <!-- Login Button -->
                <button 
                    type="button"
                    @click="goToLogin" 
                    class="btn-secondary-custom" 
                    style="width: 100%;"
                >
                    <i class="bi bi-box-arrow-in-right"></i> Sign In Instead
                </button>
            </form>
        </div>

        <!-- Footer -->
        <footer class="footer">
            <div class="container-custom">
                <p>
                    <i class="bi bi-c-circle"></i> 2025 ESYPARK. All Rights Reserved.
                </p>
                <p style="margin-top: 10px;">
                    <a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a>
                </p>
            </div>
        </footer>
    </div>
    `
}
