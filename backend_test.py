import requests
import sys
import json
from datetime import datetime

class VoltNetAPITester:
    def __init__(self, base_url="https://solar-exchange-2.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user = None
        self.wallet_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "status": "PASSED" if success else "FAILED",
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        if data:
            print(f"   Data: {json.dumps(data, indent=2)}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    self.log_test(name, True)
                    return True, response_data
                except:
                    self.log_test(name, True, "No JSON response")
                    return True, {}
            else:
                try:
                    error_data = response.json()
                    self.log_test(name, False, f"Status {response.status_code}: {error_data}")
                except:
                    self.log_test(name, False, f"Status {response.status_code}: {response.text}")
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_auth_register(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_user_data = {
            "name": f"Test User {timestamp}",
            "email": f"test{timestamp}@voltnet.com",
            "password": "test123456",
            "address": "Mumbai, India"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        
        if success and 'token' in response and 'user' in response:
            self.token = response['token']
            self.user = response['user']
            print(f"   ✅ Token received: {self.token[:20]}...")
            print(f"   ✅ User ID: {self.user.get('id')}")
            return True
        return False

    def test_auth_login_admin(self):
        """Test admin login"""
        admin_data = {
            "email": "admin@voltnet.com",
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data=admin_data
        )
        
        if success and 'token' in response:
            # Store admin token separately for admin tests
            print(f"   ✅ Admin token received: {response['token'][:20]}...")
            return True
        return False

    def test_auth_me(self):
        """Test get current user"""
        if not self.token:
            self.log_test("Get Current User", False, "No token available")
            return False
            
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        
        if success and 'id' in response:
            print(f"   ✅ User data retrieved: {response.get('name')}")
            return True
        return False

    def test_wallet_connect(self):
        """Test wallet connection"""
        if not self.token:
            self.log_test("Wallet Connect", False, "No token available")
            return False
            
        wallet_data = {
            "role": "buyer"
        }
        
        success, response = self.run_test(
            "Wallet Connect",
            "POST",
            "wallet/connect",
            200,
            data=wallet_data
        )
        
        if success and 'wallet_id' in response:
            self.wallet_id = response['wallet_id']
            self.user = response  # Update user data
            print(f"   ✅ Wallet connected: {self.wallet_id}")
            print(f"   ✅ Role set: {response.get('role')}")
            print(f"   ✅ Token balance: ₹{response.get('token_balance')}")
            return True
        return False

    def test_wallet_get(self):
        """Test get wallet info"""
        if not self.wallet_id:
            self.log_test("Get Wallet Info", False, "No wallet ID available")
            return False
            
        success, response = self.run_test(
            "Get Wallet Info",
            "GET",
            f"wallet/{self.wallet_id}",
            200
        )
        
        if success and 'wallet_id' in response:
            print(f"   ✅ Wallet info retrieved: {response.get('name')}")
            return True
        return False

    def test_create_order(self):
        """Test creating an order"""
        if not self.wallet_id:
            self.log_test("Create Order", False, "No wallet ID available")
            return False
            
        order_data = {
            "wallet_id": self.wallet_id,
            "type": "buy",
            "energy_kwh": 25.5,
            "price_per_kwh": 8.5
        }
        
        success, response = self.run_test(
            "Create Buy Order",
            "POST",
            "orders",
            200,
            data=order_data
        )
        
        if success and 'id' in response:
            print(f"   ✅ Order created: {response.get('id')}")
            print(f"   ✅ Energy: {response.get('energy_kwh')} kWh")
            print(f"   ✅ Price: ₹{response.get('price_per_kwh')}/kWh")
            return response.get('id')
        return None

    def test_get_orders(self):
        """Test getting orders"""
        success, response = self.run_test(
            "Get All Orders",
            "GET",
            "orders",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   ✅ Retrieved {len(response)} orders")
            return True
        return False

    def test_get_user_orders(self):
        """Test getting user orders"""
        if not self.wallet_id:
            self.log_test("Get User Orders", False, "No wallet ID available")
            return False
            
        success, response = self.run_test(
            "Get User Orders",
            "GET",
            f"orders/user/{self.wallet_id}",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   ✅ Retrieved {len(response)} user orders")
            return True
        return False

    def test_market_stats(self):
        """Test market statistics"""
        success, response = self.run_test(
            "Market Statistics",
            "GET",
            "market/stats",
            200
        )
        
        if success and 'total_orders' in response:
            print(f"   ✅ Total orders: {response.get('total_orders')}")
            print(f"   ✅ Market efficiency: {response.get('market_efficiency')}%")
            print(f"   ✅ Average price: ₹{response.get('avg_price')}")
            return True
        return False

    def test_market_prices(self):
        """Test market prices"""
        success, response = self.run_test(
            "Market Prices",
            "GET",
            "market/prices",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   ✅ Retrieved {len(response)} price points")
            return True
        return False

    def test_blockchain(self):
        """Test blockchain ledger"""
        success, response = self.run_test(
            "Blockchain Ledger",
            "GET",
            "blockchain",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   ✅ Retrieved {len(response)} blocks")
            return True
        return False

    def test_transactions(self):
        """Test transactions"""
        success, response = self.run_test(
            "All Transactions",
            "GET",
            "transactions",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   ✅ Retrieved {len(response)} transactions")
            return True
        return False

    def test_notifications(self):
        """Test notifications"""
        if not self.wallet_id:
            self.log_test("Get Notifications", False, "No wallet ID available")
            return False
            
        success, response = self.run_test(
            "Get Notifications",
            "GET",
            f"notifications/{self.wallet_id}",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   ✅ Retrieved {len(response)} notifications")
            return True
        return False

    def test_matching_engine(self):
        """Test matching engine"""
        success, response = self.run_test(
            "Run Matching Engine",
            "POST",
            "match",
            200
        )
        
        if success and 'matched' in response:
            print(f"   ✅ Matched {response.get('matched')} trades")
            print(f"   ✅ Transactions: {len(response.get('transactions', []))}")
            return True
        return False

    def test_cancel_order(self, order_id):
        """Test canceling an order"""
        if not order_id:
            self.log_test("Cancel Order", False, "No order ID available")
            return False
            
        success, response = self.run_test(
            "Cancel Order",
            "DELETE",
            f"orders/{order_id}",
            200
        )
        
        if success:
            print(f"   ✅ Order {order_id} cancelled")
            return True
        return False

    def test_invalid_auth(self):
        """Test invalid authentication"""
        # Save current token
        original_token = self.token
        self.token = "invalid_token_12345"
        
        success, response = self.run_test(
            "Invalid Auth Token",
            "GET",
            "auth/me",
            401
        )
        
        # Restore original token
        self.token = original_token
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting VoltNet API Tests")
        print("=" * 50)
        
        # Test authentication
        if not self.test_auth_register():
            print("❌ Registration failed, stopping tests")
            return False
            
        self.test_auth_login_admin()
        self.test_auth_me()
        self.test_invalid_auth()
        
        # Test wallet
        if not self.test_wallet_connect():
            print("❌ Wallet connection failed, stopping wallet tests")
        else:
            self.test_wallet_get()
        
        # Test orders
        order_id = self.test_create_order()
        self.test_get_orders()
        self.test_get_user_orders()
        
        # Test market data
        self.test_market_stats()
        self.test_market_prices()
        self.test_blockchain()
        self.test_transactions()
        self.test_notifications()
        
        # Test matching engine
        self.test_matching_engine()
        
        # Test order cancellation
        if order_id:
            self.test_cancel_order(order_id)
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            print("\nFailed tests:")
            for result in self.test_results:
                if result["status"] == "FAILED":
                    print(f"  - {result['test']}: {result['details']}")
            return False

def main():
    tester = VoltNetAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())