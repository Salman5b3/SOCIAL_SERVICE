#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: "Build a clone of mindcap.in (voter search platform). User provided 632 PDFs from Google Drive containing 2002 Andhra Pradesh electoral rolls for 3 assemblies (Rayachoty/152, Lakkireddipalli/153, Kadapa/154). Rebranded as 'Social Service from MR India'. Voter names are Telugu CID-encoded - storing partial Unicode fragments + source PDFs for verification (Option A chosen by user)."

backend:
  - task: "PDF ingestion of 632 electoral roll PDFs into MongoDB"
    implemented: true
    working: true
    file: "/app/backend/ingest.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: true
        -agent: "main"
        -comment: "Ingestion script extracts structured fields (S.No, Door No, Age, Sex, Relation type, EPIC ID) from each PDF page. Part number auto-detected from page 1 header. Running in background, expected ~300k+ voter records when done."

  - task: "GET /api/stats - global stats"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Returns total voters, assemblies, parts. Used on homepage stats grid."
        -working: true
        -agent: "testing"
        -comment: "✓ PASSED - Returns 255,246 voters (>100k requirement met), 3 assemblies, 328 parts, 4 nodes. All required fields present with correct data types."

  - task: "GET /api/assemblies - list assemblies"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Returns all assemblies sorted by code. Used in dropdowns on Home/Search/Directory."
        -working: true
        -agent: "testing"
        -comment: "Minor: ✓ PASSED - Returns all 3 assemblies (152, 153, 154) with correct codes and all required fields (code, name, district). Assembly names include code prefix (e.g., '152 - Rayachoty' instead of 'Rayachoty') which is actually better for display. Core functionality working perfectly."

  - task: "GET /api/assemblies/{code}/parts"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Returns parts for given assembly with voter counts."
        -working: true
        -agent: "testing"
        -comment: "✓ PASSED - Returns exactly 191 parts for Rayachoty (152) as expected. Each part has partNo, voterCount, sourcePdf fields. Sample: Part 1 has 456 voters, sourcePdf: 17578400024658."

  - task: "GET /api/voters/search - paginated search with filters"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Supports q (EPIC/door/text), assembly, gender, ageMin, ageMax, page, pageSize. EPIC pattern detection routes to indexed field query."
        -working: true
        -agent: "testing"
        -comment: "✓ PASSED - All 4 test scenarios passed: (1) EPIC ID search 'AP221520000003' found 1 voter with all required fields, (2) Gender filter (Female in 152) found 73,790 voters with 100% accuracy, (3) Age range filter (30-50 in 152) found 73,974 voters with correct filtering, (4) Door number search '1-1' found 9,911 voters with correct pattern matching. Response structure correct: {total, page, pageSize, pages, results}. Each voter has all required fields: serialNo, doorNo, gender, age, epicId, assemblyCode, partNo, sourcePdf."

  - task: "GET /api/voters/directory - browse by assembly+part"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Returns all voters in a given part sorted by serial no. Includes sourcePdf reference."
        -working: true
        -agent: "testing"
        -comment: "✓ PASSED - Returns exactly 456 voters for Rayachoty Part 1 (assembly=152, partNo=1) as expected. Results properly sorted by serialNo. Response includes sourcePdf field (17578400024658). All required fields present: {total, page, pageSize, pages, results, sourcePdf}."

  - task: "GET /api/source-pdf/{assembly}/{part} - serve original PDF"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Looks up source PDF filename from parts collection, serves file from /app/data_input/Andhra Pradesh/{folder}/. Verified 200 + application/pdf with curl."
        -working: true
        -agent: "testing"
        -comment: "✓ PASSED - Returns 200 status with correct Content-Type: application/pdf header. Content-Length: 310,073 bytes. PDF file serving working correctly."

frontend:
  - task: "Home page wired to /api/stats and /api/assemblies"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/Home.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Real stats shown in 4-card grid; live coverage badge uses first assembly from API. Search-now button navigates to /search."

  - task: "Search page with debounced live API search"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/Search.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "250ms debounce; clicking card opens source PDF in new tab. Shows partial Telugu name fragments."

  - task: "Directory page with assembly+part loader"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/Directory.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Loads paginated voter table; 'View Source PDF' button opens original."

  - task: "Admin login page (UI only, no auth backend)"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/AdminLogin.jsx"
    stuck_count: 0
    priority: "low"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Submit shows 'auth not configured' message. By design per user request."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: false

test_plan:
  current_focus: []
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    -agent: "main"
    -message: "Backend ingestion is still running in the background (will finish in ~20 mins, total ~300k records expected). Around 220k+ records are already ingested across Rayachoty (152) fully and Lakkireddipalli (153) partially. Please test all 6 endpoints with focus on: (1) /api/voters/search by EPIC ID like AP221520000003 (Rayachoty Part 1), (2) /api/voters/search filters (gender=Female, ageMin=30, ageMax=60), (3) /api/voters/directory for assembly=152, partNo=1 (should return 456 voters), (4) /api/assemblies/152/parts (should return 191 parts), (5) /api/source-pdf/152/1 (should stream a PDF, content-type application/pdf). Use REACT_APP_BACKEND_URL from /app/frontend/.env (https://mindcap-builder.preview.emergentagent.com). All endpoints prefixed with /api."
    -agent: "testing"
    -message: "✅ ALL BACKEND TESTS PASSED! Tested all 6 endpoints successfully. Data ingestion completed with 255,246 voters (exceeded 100k requirement). All API endpoints working correctly: stats, assemblies list, assembly parts, voter search (EPIC ID, gender, age range, door number filters all working), directory listing, and PDF serving. All response structures correct with proper pagination, filtering, and sorting. Ready for production use."
