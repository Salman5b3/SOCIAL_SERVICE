#!/usr/bin/env python3
"""
Backend API Testing for Social Service from MR India - Voter Search Platform
Tests all 6 endpoints with specific scenarios as per requirements.
"""

import requests
import json
from typing import Dict, Any, List

# Backend URL from frontend/.env
BASE_URL = "https://mindcap-builder.preview.emergentagent.com/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def print_test(name: str, passed: bool, details: str = ""):
    status = f"{Colors.GREEN}✓ PASS{Colors.RESET}" if passed else f"{Colors.RED}✗ FAIL{Colors.RESET}"
    print(f"{status} - {name}")
    if details:
        print(f"  {details}")
    print()

def test_stats_endpoint():
    """Test 1: GET /api/stats - should return voters > 100,000"""
    print(f"{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"{Colors.BLUE}TEST 1: GET /api/stats{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*80}{Colors.RESET}\n")
    
    try:
        response = requests.get(f"{BASE_URL}/stats", timeout=10)
        
        if response.status_code != 200:
            print_test("Stats endpoint status code", False, f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        # Check required fields
        required_fields = ["voters", "assemblies", "parts", "nodes"]
        missing_fields = [f for f in required_fields if f not in data]
        
        if missing_fields:
            print_test("Stats response structure", False, f"Missing fields: {missing_fields}")
            return False
        
        print_test("Stats response structure", True, f"All required fields present: {required_fields}")
        
        # Check voter count > 100,000
        voter_count = data["voters"]
        if voter_count > 100000:
            print_test("Voter count > 100,000", True, f"Voter count: {voter_count:,}")
        else:
            print_test("Voter count > 100,000", False, f"Voter count: {voter_count:,} (expected > 100,000)")
            return False
        
        # Check other counts
        print(f"  Assemblies: {data['assemblies']}")
        print(f"  Parts: {data['parts']}")
        print(f"  Nodes: {data['nodes']}")
        
        return True
        
    except Exception as e:
        print_test("Stats endpoint", False, f"Exception: {str(e)}")
        return False

def test_assemblies_endpoint():
    """Test 2: GET /api/assemblies - should return 3 assemblies"""
    print(f"\n{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"{Colors.BLUE}TEST 2: GET /api/assemblies{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*80}{Colors.RESET}\n")
    
    try:
        response = requests.get(f"{BASE_URL}/assemblies", timeout=10)
        
        if response.status_code != 200:
            print_test("Assemblies endpoint status code", False, f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        # Check it's an array
        if not isinstance(data, list):
            print_test("Assemblies response type", False, f"Expected array, got {type(data)}")
            return False
        
        print_test("Assemblies response type", True, "Response is an array")
        
        # Check count
        if len(data) != 3:
            print_test("Assembly count", False, f"Expected 3 assemblies, got {len(data)}")
            return False
        
        print_test("Assembly count", True, f"Found 3 assemblies")
        
        # Check specific assemblies
        expected_assemblies = {
            "152": "Rayachoty",
            "153": "Lakkireddipalli",
            "154": "Kadapa"
        }
        
        found_assemblies = {a["code"]: a["name"] for a in data}
        
        all_match = True
        for code, name in expected_assemblies.items():
            if code in found_assemblies:
                if found_assemblies[code] == name:
                    print(f"  {Colors.GREEN}✓{Colors.RESET} Assembly {code} - {name}")
                else:
                    print(f"  {Colors.RED}✗{Colors.RESET} Assembly {code} - Expected '{name}', got '{found_assemblies[code]}'")
                    all_match = False
            else:
                print(f"  {Colors.RED}✗{Colors.RESET} Assembly {code} - {name} NOT FOUND")
                all_match = False
        
        # Check required fields
        for assembly in data:
            if not all(k in assembly for k in ["code", "name", "district"]):
                print_test("Assembly fields", False, f"Missing required fields in: {assembly}")
                return False
        
        print_test("Assembly structure", True, "All assemblies have code, name, district fields")
        
        return all_match
        
    except Exception as e:
        print_test("Assemblies endpoint", False, f"Exception: {str(e)}")
        return False

def test_assembly_parts_endpoint():
    """Test 3: GET /api/assemblies/152/parts - should return ~191 parts"""
    print(f"\n{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"{Colors.BLUE}TEST 3: GET /api/assemblies/152/parts{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*80}{Colors.RESET}\n")
    
    try:
        response = requests.get(f"{BASE_URL}/assemblies/152/parts", timeout=10)
        
        if response.status_code != 200:
            print_test("Assembly parts endpoint status code", False, f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        # Check it's an array
        if not isinstance(data, list):
            print_test("Assembly parts response type", False, f"Expected array, got {type(data)}")
            return False
        
        print_test("Assembly parts response type", True, "Response is an array")
        
        # Check count (~191 parts)
        part_count = len(data)
        print(f"  Part count: {part_count}")
        
        if 180 <= part_count <= 200:  # Allow some tolerance
            print_test("Part count for Rayachoty (152)", True, f"Found {part_count} parts (expected ~191)")
        else:
            print_test("Part count for Rayachoty (152)", False, f"Found {part_count} parts (expected ~191)")
            return False
        
        # Check structure of first few parts
        if len(data) > 0:
            sample_part = data[0]
            required_fields = ["partNo", "voterCount", "sourcePdf"]
            missing_fields = [f for f in required_fields if f not in sample_part]
            
            if missing_fields:
                print_test("Part structure", False, f"Missing fields: {missing_fields}")
                return False
            
            print_test("Part structure", True, f"All required fields present: {required_fields}")
            print(f"  Sample part: {json.dumps(sample_part, indent=2)}")
        
        return True
        
    except Exception as e:
        print_test("Assembly parts endpoint", False, f"Exception: {str(e)}")
        return False

def test_voter_search_endpoint():
    """Test 4: GET /api/voters/search - multiple scenarios"""
    print(f"\n{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"{Colors.BLUE}TEST 4: GET /api/voters/search (Multiple Scenarios){Colors.RESET}")
    print(f"{Colors.BLUE}{'='*80}{Colors.RESET}\n")
    
    all_passed = True
    
    # Scenario 1: Search by EPIC ID
    print(f"{Colors.YELLOW}Scenario 4.1: Search by EPIC ID (AP221520000003){Colors.RESET}")
    try:
        params = {"q": "AP221520000003", "assembly": "ALL"}
        response = requests.get(f"{BASE_URL}/voters/search", params=params, timeout=10)
        
        if response.status_code != 200:
            print_test("EPIC ID search status", False, f"Expected 200, got {response.status_code}")
            all_passed = False
        else:
            data = response.json()
            
            # Check response structure
            required_fields = ["total", "page", "pageSize", "pages", "results"]
            missing_fields = [f for f in required_fields if f not in data]
            
            if missing_fields:
                print_test("Search response structure", False, f"Missing fields: {missing_fields}")
                all_passed = False
            else:
                print_test("Search response structure", True, "All required fields present")
                
                # Check if results found
                if data["total"] > 0:
                    print_test("EPIC ID search results", True, f"Found {data['total']} voter(s)")
                    
                    # Check voter structure
                    if len(data["results"]) > 0:
                        voter = data["results"][0]
                        voter_fields = ["serialNo", "doorNo", "gender", "age", "epicId", "assemblyCode", "partNo", "sourcePdf"]
                        missing_voter_fields = [f for f in voter_fields if f not in voter]
                        
                        if missing_voter_fields:
                            print_test("Voter result structure", False, f"Missing fields: {missing_voter_fields}")
                            all_passed = False
                        else:
                            print_test("Voter result structure", True, "All required fields present")
                            print(f"  Sample voter: {json.dumps(voter, indent=2)}")
                else:
                    print_test("EPIC ID search results", False, "No voters found for AP221520000003")
                    all_passed = False
    except Exception as e:
        print_test("EPIC ID search", False, f"Exception: {str(e)}")
        all_passed = False
    
    # Scenario 2: Filter by gender
    print(f"\n{Colors.YELLOW}Scenario 4.2: Filter by gender (Female in assembly 152){Colors.RESET}")
    try:
        params = {"assembly": "152", "gender": "Female", "pageSize": 10}
        response = requests.get(f"{BASE_URL}/voters/search", params=params, timeout=10)
        
        if response.status_code != 200:
            print_test("Gender filter status", False, f"Expected 200, got {response.status_code}")
            all_passed = False
        else:
            data = response.json()
            
            if data["total"] > 0:
                print_test("Gender filter results", True, f"Found {data['total']} female voters in assembly 152")
                
                # Verify all results are female
                all_female = all(v["gender"] == "Female" for v in data["results"])
                if all_female:
                    print_test("Gender filter accuracy", True, "All results are Female")
                else:
                    print_test("Gender filter accuracy", False, "Some results are not Female")
                    all_passed = False
            else:
                print_test("Gender filter results", False, "No female voters found")
                all_passed = False
    except Exception as e:
        print_test("Gender filter", False, f"Exception: {str(e)}")
        all_passed = False
    
    # Scenario 3: Age range filter
    print(f"\n{Colors.YELLOW}Scenario 4.3: Age range filter (30-50 in assembly 152){Colors.RESET}")
    try:
        params = {"assembly": "152", "ageMin": 30, "ageMax": 50, "pageSize": 5}
        response = requests.get(f"{BASE_URL}/voters/search", params=params, timeout=10)
        
        if response.status_code != 200:
            print_test("Age filter status", False, f"Expected 200, got {response.status_code}")
            all_passed = False
        else:
            data = response.json()
            
            if data["total"] > 0:
                print_test("Age filter results", True, f"Found {data['total']} voters aged 30-50 in assembly 152")
                
                # Verify all results are in age range
                all_in_range = all(30 <= v["age"] <= 50 for v in data["results"])
                if all_in_range:
                    print_test("Age filter accuracy", True, "All results are in age range 30-50")
                else:
                    print_test("Age filter accuracy", False, "Some results are outside age range")
                    all_passed = False
            else:
                print_test("Age filter results", False, "No voters found in age range")
                all_passed = False
    except Exception as e:
        print_test("Age filter", False, f"Exception: {str(e)}")
        all_passed = False
    
    # Scenario 4: Door number search
    print(f"\n{Colors.YELLOW}Scenario 4.4: Door number search (1-1){Colors.RESET}")
    try:
        params = {"q": "1-1", "pageSize": 5}
        response = requests.get(f"{BASE_URL}/voters/search", params=params, timeout=10)
        
        if response.status_code != 200:
            print_test("Door number search status", False, f"Expected 200, got {response.status_code}")
            all_passed = False
        else:
            data = response.json()
            
            if data["total"] > 0:
                print_test("Door number search results", True, f"Found {data['total']} voters with door number starting with 1-1")
                
                # Verify results have door numbers starting with 1-1
                all_match = all(v["doorNo"].startswith("1-1") for v in data["results"])
                if all_match:
                    print_test("Door number search accuracy", True, "All results have door numbers starting with 1-1")
                else:
                    print_test("Door number search accuracy", False, "Some results don't match door number pattern")
                    all_passed = False
            else:
                print_test("Door number search results", False, "No voters found with door number 1-1")
                all_passed = False
    except Exception as e:
        print_test("Door number search", False, f"Exception: {str(e)}")
        all_passed = False
    
    return all_passed

def test_voter_directory_endpoint():
    """Test 5: GET /api/voters/directory - assembly 152, part 1 should return 456 voters"""
    print(f"\n{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"{Colors.BLUE}TEST 5: GET /api/voters/directory{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*80}{Colors.RESET}\n")
    
    try:
        params = {"assembly": "152", "partNo": 1, "pageSize": 50}
        response = requests.get(f"{BASE_URL}/voters/directory", params=params, timeout=10)
        
        if response.status_code != 200:
            print_test("Directory endpoint status code", False, f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        # Check response structure
        required_fields = ["total", "page", "pageSize", "pages", "results", "sourcePdf"]
        missing_fields = [f for f in required_fields if f not in data]
        
        if missing_fields:
            print_test("Directory response structure", False, f"Missing fields: {missing_fields}")
            return False
        
        print_test("Directory response structure", True, "All required fields present")
        
        # Check total count (should be 456 for Rayachoty Part 1)
        total_voters = data["total"]
        print(f"  Total voters in Rayachoty Part 1: {total_voters}")
        
        if total_voters == 456:
            print_test("Directory voter count", True, f"Found exactly 456 voters in Rayachoty Part 1")
        else:
            print_test("Directory voter count", False, f"Expected 456 voters, got {total_voters}")
            return False
        
        # Check results are sorted by serialNo
        if len(data["results"]) > 1:
            serial_nos = [v["serialNo"] for v in data["results"]]
            is_sorted = all(serial_nos[i] <= serial_nos[i+1] for i in range(len(serial_nos)-1))
            
            if is_sorted:
                print_test("Directory sorting", True, "Results sorted by serialNo")
            else:
                print_test("Directory sorting", False, "Results not properly sorted by serialNo")
                return False
        
        # Check sourcePdf is present
        if data["sourcePdf"]:
            print_test("Directory sourcePdf", True, f"sourcePdf: {data['sourcePdf']}")
        else:
            print_test("Directory sourcePdf", False, "sourcePdf is missing or empty")
        
        return True
        
    except Exception as e:
        print_test("Directory endpoint", False, f"Exception: {str(e)}")
        return False

def test_source_pdf_endpoint():
    """Test 6: GET /api/source-pdf/152/1 - should return PDF with correct headers"""
    print(f"\n{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"{Colors.BLUE}TEST 6: GET /api/source-pdf/152/1{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*80}{Colors.RESET}\n")
    
    try:
        response = requests.get(f"{BASE_URL}/source-pdf/152/1", timeout=10, stream=True)
        
        if response.status_code != 200:
            print_test("Source PDF endpoint status code", False, f"Expected 200, got {response.status_code}")
            return False
        
        print_test("Source PDF endpoint status code", True, "Status code 200")
        
        # Check content-type header
        content_type = response.headers.get("content-type", "")
        if content_type == "application/pdf":
            print_test("Source PDF content-type", True, f"Content-Type: {content_type}")
        else:
            print_test("Source PDF content-type", False, f"Expected 'application/pdf', got '{content_type}'")
            return False
        
        # Check content-length (should be present and > 0)
        content_length = response.headers.get("content-length")
        if content_length:
            print_test("Source PDF content-length", True, f"Content-Length: {content_length} bytes")
        else:
            print(f"  {Colors.YELLOW}Note: Content-Length header not present (may be chunked transfer){Colors.RESET}")
        
        return True
        
    except Exception as e:
        print_test("Source PDF endpoint", False, f"Exception: {str(e)}")
        return False

def main():
    print(f"\n{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"{Colors.BLUE}Social Service from MR India - Backend API Testing{Colors.RESET}")
    print(f"{Colors.BLUE}Base URL: {BASE_URL}{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*80}{Colors.RESET}\n")
    
    results = {
        "GET /api/stats": test_stats_endpoint(),
        "GET /api/assemblies": test_assemblies_endpoint(),
        "GET /api/assemblies/152/parts": test_assembly_parts_endpoint(),
        "GET /api/voters/search": test_voter_search_endpoint(),
        "GET /api/voters/directory": test_voter_directory_endpoint(),
        "GET /api/source-pdf/152/1": test_source_pdf_endpoint(),
    }
    
    # Summary
    print(f"\n{Colors.BLUE}{'='*80}{Colors.RESET}")
    print(f"{Colors.BLUE}TEST SUMMARY{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*80}{Colors.RESET}\n")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for endpoint, result in results.items():
        status = f"{Colors.GREEN}✓ PASS{Colors.RESET}" if result else f"{Colors.RED}✗ FAIL{Colors.RESET}"
        print(f"{status} - {endpoint}")
    
    print(f"\n{Colors.BLUE}Total: {passed}/{total} tests passed{Colors.RESET}")
    
    if passed == total:
        print(f"{Colors.GREEN}All tests passed!{Colors.RESET}\n")
        return 0
    else:
        print(f"{Colors.RED}{total - passed} test(s) failed{Colors.RESET}\n")
        return 1

if __name__ == "__main__":
    exit(main())
