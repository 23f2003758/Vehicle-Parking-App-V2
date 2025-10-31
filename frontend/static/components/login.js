import { ref } from 'vue'
import { useRouter } from 'vue-router'

export default {
    setup() {
        const router = useRouter()
        
        const showAlert = ref('')
        const message = ref('')
        const user = ref({
            email: '',
            password: ''
        })

        const goToRegister = () => {
            router.push('/signup')
        }

        const loginUser = async () => {
            try {
                const response = await fetch('/api/login', {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(user.value)
                })
                
                const data = await response.json()
                
                console.log('=== LOGIN DEBUG INFO ===')
                console.log('Status:', response.status)
                console.log('Raw Data:', JSON.stringify(data, null, 2))
                console.log('========================')
                
                if (response.status === 200) {
                    const authToken = data.user_details?.auth_token
                    const userEmail = data.user_details?.email
                    const userRoles = data.user_details?.roles || []
                    
                    if (authToken) {
                        localStorage.setItem("auth_token", authToken)
                        localStorage.setItem("email", userEmail)
                        localStorage.setItem("username", userEmail.split('@')[0])
                        
                        showAlert.value = 'success'
                        message.value = 'Login successful! Redirecting...'
                        
                        // Check if Swal exists, otherwise just redirect
                        if (typeof Swal !== 'undefined') {
                            await Swal.fire({
                                title: "Welcome back!",
                                text: "You have logged in successfully!",
                                icon: "success",
                                timer: 100,
                                showConfirmButton: false
                            })
                        } else {
                            // Wait 1.5 seconds before redirecting
                            await new Promise(resolve => setTimeout(resolve, 1500))
                        }
                        
                        // Navigate based on role
                        if (userRoles.includes('user')) {
                            console.log('Redirecting to dashboard...')
                            router.push('/dashboard')
                        } else {
                            console.log('Redirecting to admin-home...')
                            router.push('/admindashboard')
                        }
                    }
                } else {
                    let errorMsg = 'Login failed. Please try again.'
                    
                    if (data.response && data.response.errors && data.response.errors.length > 0) {
                        errorMsg = data.response.errors[0]
                    } else if (data.message) {
                        errorMsg = data.message
                    }
                    
                    message.value = errorMsg
                    showAlert.value = 'error'
                }
            } catch (error) {
                console.error('Exception during login:', error)
                message.value = 'An error occurred. Please try again.'
                showAlert.value = 'error'
            }
        }

        return {
            showAlert,
            message,
            user,
            goToRegister,
            loginUser
        }
    },
    template: `
    <div>
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

        <div class="form-container fade-in">
            <h2 class="form-title">
                <i class="bi bi-box-arrow-in-right"></i> Welcome Back!
            </h2>
            
            <p style="text-align: center; color: #666; margin-bottom: 30px;">
                Sign in to access your parking account
            </p>

            <div v-if="message && showAlert === 'error'" class="alert-custom alert-error">
                <i class="bi bi-exclamation-triangle"></i>
                {{ message }}
            </div>
            
            <div v-if="showAlert === 'success'" class="alert-custom alert-success">
                <i class="bi bi-check-circle"></i>
                Login successful! Redirecting...
            </div>

            <form @submit.prevent="loginUser">
                <div class="form-group">
                    <label class="form-label" for="email">
                        <i class="bi bi-envelope"></i> Email Address
                    </label>
                    <input 
                        type="email" 
                        id="email" 
                        v-model="user.email"
                        class="form-control" 
                        placeholder="your@email.com"
                        required
                    >
                    <small style="color: #666; font-size: 0.875rem; display: block; margin-top: 5px;">
                        We'll never share your email with anyone else.
                    </small>
                </div>

                <div class="form-group">
                    <label class="form-label" for="password">
                        <i class="bi bi-lock"></i> Password
                    </label>
                    <input 
                        type="password" 
                        id="password" 
                        v-model="user.password"
                        class="form-control" 
                        placeholder="Enter your password"
                        required
                    >
                </div>

                <div class="form-group" style="margin-bottom: 20px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input 
                            type="checkbox" 
                            style="width: 18px; height: 18px; cursor: pointer;"
                        >
                        <span style="color: #555; font-size: 0.95rem;">Remember me for 30 days</span>
                    </label>
                </div>

                <button 
                    type="submit" 
                    class="btn-primary-custom" 
                    style="width: 100%; margin-bottom: 20px;"
                >
                    <i class="bi bi-box-arrow-in-right"></i> Sign In
                </button>

                <div style="text-align: center; margin: 20px 0; color: #999;">
                    <span style="position: relative;">
                        <span style="background: rgba(255, 255, 255, 0.97); padding: 0 10px; position: relative; z-index: 1;">
                            Don't have an account?
                        </span>
                        <hr style="position: absolute; top: 50%; left: 0; right: 0; margin: 0; border: none; border-top: 1px solid #ddd; z-index: 0;">
                    </span>
                </div>

                <button 
                    type="button"
                    @click="goToRegister" 
                    class="btn-secondary-custom" 
                    style="width: 100%;"
                >
                    <i class="bi bi-person-plus"></i> Create New Account
                </button>

                
            </form>
        </div>

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