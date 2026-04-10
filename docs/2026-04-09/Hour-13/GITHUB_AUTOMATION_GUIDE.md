# GitHub Automation Guide - How .github Files Work

> **Complete guide to understanding GitHub's automation features in the SurfSense project**

---

## Overview

The `.github` folder contains special configuration files that GitHub recognizes and uses to automate various aspects of your repository, including:

- **Issue templates** - Standardized forms for bug reports and feature requests
- **Pull request templates** - Consistent PR descriptions
- **GitHub Actions workflows** - Automated testing and quality checks
- **Funding information** - Sponsor buttons
- **Community health files** - Contributing guidelines, code of conduct

---

## Directory Structure

```
.github/
├── ISSUE_TEMPLATE/          # Issue templates for bug reports, features, etc.
│   ├── bug_report.md
│   ├── feature_request.md
│   ├── documentation.md
│   ├── config.yml
│   └── README.md
├── workflows/               # GitHub Actions automation
│   ├── backend-tests.yml
│   ├── code-quality.yml
│   └── docker-build.yml
├── FUNDING.yml             # Sponsor/funding information
└── PULL_REQUEST_TEMPLATE.md  # PR template
```

---

## 1. Issue Templates

**Location:** `.github/ISSUE_TEMPLATE/`

**Purpose:** Provide structured forms when users create issues, ensuring they include all necessary information.

### How It Works

When someone clicks "New Issue" on GitHub, they see a menu of issue types:

1. 🐛 Bug Report
2. ✨ Feature Request
3. 📚 Documentation
4. 💬 Discussions (external link)

### config.yml

```yaml
blank_issues_enabled: true  # Allow blank issues
contact_links:
  - name: 📚 Documentation
    url: https://www.surfsense.com/docs
    about: Check our documentation for guides
  - name: 💬 Discussions
    url: https://github.com/MODSetter/SurfSense/discussions
    about: Ask questions and discuss ideas
```

**What it does:**
- Enables/disables blank issues
- Adds external links to the issue creation menu
- Redirects users to appropriate resources before creating issues

### Example: bug_report.md

```markdown
---
name: Bug Report
about: Report a bug to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

## Describe the bug
A clear description of what the bug is.

## Steps to reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected behavior
What you expected to happen.

## Screenshots
If applicable, add screenshots.
```

**What it does:**
- Pre-fills issue title with `[BUG]`
- Automatically adds `bug` label
- Provides structured sections for bug information

---

## 2. Pull Request Template

**Location:** `.github/PULL_REQUEST_TEMPLATE.md`

**Purpose:** Ensure all PRs include necessary information and follow project standards.

### How It Works

When someone creates a pull request, the description field is automatically filled with this template:

```markdown
## Description
<!--- Clearly describe what has changed -->

## Motivation and Context
<!--- Why is this change required? -->
FIX #

## Change Type
- [ ] Bug fix
- [ ] New feature
- [ ] Performance improvement
- [ ] Documentation

## Testing Performed
- [ ] Tested locally
- [ ] Manual/QA verification

## Checklist
- [ ] Follows project coding standards
- [ ] Documentation updated
- [ ] All tests passing
```

**Benefits:**
- Consistent PR descriptions
- Ensures testing is documented
- Links to related issues
- Checklist for code quality

---

## 3. GitHub Actions Workflows

**Location:** `.github/workflows/`

**Purpose:** Automate testing, code quality checks, and deployments.

### How GitHub Actions Work

**Trigger → Jobs → Steps → Actions**

1. **Trigger:** Event that starts the workflow (push, PR, schedule)
2. **Jobs:** Independent tasks that run in parallel or sequence
3. **Steps:** Individual commands within a job
4. **Actions:** Reusable units of code (from marketplace or custom)

---

### Workflow 1: Backend Tests (`backend-tests.yml`)

**Purpose:** Run automated tests on backend code

**Triggers:**
```yaml
on:
  pull_request:
    branches: [main, dev]
    types: [opened, synchronize, reopened, ready_for_review]
```

**What it does:**
- Runs when PR is opened or updated
- Only runs on non-draft PRs
- Checks if backend files changed (optimization)

**Jobs:**

#### Job 1: Unit Tests
```yaml
jobs:
  unit-tests:
    runs-on: ubuntu-latest  # Uses Ubuntu VM
    steps:
      - name: Checkout code
        uses: actions/checkout@v6  # Downloads your code
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      
      - name: Install dependencies
        run: uv sync
      
      - name: Run unit tests
        run: uv run pytest -m unit
```

**What happens:**
1. GitHub spins up a fresh Ubuntu VM
2. Checks out your code
3. Installs Python 3.12
4. Installs dependencies with UV
5. Runs unit tests with pytest
6. Reports success/failure

#### Job 2: Integration Tests
```yaml
integration-tests:
  services:
    postgres:
      image: pgvector/pgvector:pg17  # Starts PostgreSQL
      env:
        POSTGRES_PASSWORD: postgres
      ports:
        - 5432:5432
```

**What happens:**
1. Starts PostgreSQL database in Docker
2. Waits for database to be healthy
3. Runs integration tests against real database
4. Cleans up after tests

#### Job 3: Test Gate
```yaml
test-gate:
  needs: [unit-tests, integration-tests]  # Waits for both
  if: always()  # Runs even if tests fail
  
  steps:
    - name: Check all test jobs
      run: |
        if [[ "${{ needs.unit-tests.result }}" == "failure" ]]; then
          exit 1  # Fail the workflow
        fi
```

**What it does:**
- Waits for all tests to complete
- Checks if any failed
- Blocks PR merge if tests fail

**Optimizations:**

1. **Concurrency Control:**
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```
- Cancels old workflow runs when new commits are pushed
- Saves CI minutes

2. **Caching:**
```yaml
- name: Cache dependencies
  uses: actions/cache@v5
  with:
    path: ~/.cache/uv
    key: python-deps-${{ hashFiles('uv.lock') }}
```
- Caches Python packages
- Speeds up subsequent runs (5 min → 30 sec)

3. **Path Filtering:**
```yaml
- name: Check if backend files changed
  uses: dorny/paths-filter@v3
  with:
    filters: |
      backend:
        - 'surfsense_backend/**'
```
- Only runs tests if backend files changed
- Skips if only docs/frontend changed

---

### Workflow 2: Code Quality (`code-quality.yml`)

**Purpose:** Enforce code quality standards

**Jobs:**

#### Job 1: File Quality Checks
```yaml
file-quality:
  steps:
    - name: Run file quality checks
      run: |
        pre-commit run --from-ref $BASE_REF --to-ref HEAD
```

**What it checks:**
- ✅ Valid YAML/JSON/TOML syntax
- ✅ No merge conflicts
- ✅ No large files (>500KB)
- ✅ No debug statements (`console.log`, `print`)
- ✅ Consistent file naming

#### Job 2: Security Scan
```yaml
security-scan:
  steps:
    - name: Run security scans
      run: |
        pre-commit run detect-secrets bandit
```

**What it checks:**
- 🔒 No hardcoded secrets (API keys, passwords)
- 🔒 No SQL injection vulnerabilities
- 🔒 No insecure cryptography
- 🔒 No unsafe file operations

#### Job 3: Python Backend Quality
```yaml
python-backend:
  steps:
    - name: Run Python checks
      run: |
        pre-commit run ruff ruff-format
```

**What it checks:**
- 🐍 Code formatting (PEP 8)
- 🐍 Import sorting
- 🐍 Unused imports/variables
- 🐍 Type hints
- 🐍 Complexity (cyclomatic)

#### Job 4: TypeScript/JavaScript Quality
```yaml
typescript-frontend:
  steps:
    - name: Run Biome checks
      run: |
        pre-commit run biome-check-web biome-check-extension
```

**What it checks:**
- 📝 Code formatting (Prettier-like)
- 📝 Linting rules
- 📝 Unused variables
- 📝 Type errors
- 📝 Best practices

#### Job 5: Quality Gate
```yaml
quality-gate:
  needs: [file-quality, security-scan, python-backend, typescript-frontend]
  steps:
    - name: Check all jobs
      run: |
        if any job failed; then exit 1; fi
```

**What it does:**
- Blocks PR merge if any quality check fails
- Ensures code meets standards before merging

---

### Workflow 3: Docker Build (`docker-build.yml`)

**Purpose:** Build and test Docker images

**Typical structure:**
```yaml
docker-build:
  steps:
    - name: Build Docker image
      run: docker build -t surfsense:test .
    
    - name: Test Docker image
      run: docker run surfsense:test pytest
    
    - name: Push to registry
      if: github.ref == 'refs/heads/main'
      run: docker push surfsense:latest
```

**What it does:**
1. Builds Docker image
2. Tests image works correctly
3. Pushes to Docker Hub (only on main branch)

---

## 4. Funding Configuration

**Location:** `.github/FUNDING.yml`

**Purpose:** Display "Sponsor" button on GitHub

```yaml
github: MODSetter
```

**What it does:**
- Adds "Sponsor" button to repository
- Links to GitHub Sponsors profile
- Supports open source development

**Other options:**
```yaml
github: [user1, user2]  # Multiple GitHub sponsors
patreon: username       # Patreon
open_collective: project  # Open Collective
ko_fi: username         # Ko-fi
custom: https://example.com  # Custom URL
```

---

## How to Use These Files

### For Contributors

**When creating an issue:**
1. Click "New Issue"
2. Select appropriate template (Bug/Feature/Docs)
3. Fill in all sections
4. Submit

**When creating a PR:**
1. Create branch: `git checkout -b feature/my-feature`
2. Make changes
3. Push: `git push origin feature/my-feature`
4. Create PR on GitHub
5. Template auto-fills - complete all sections
6. Wait for CI checks to pass
7. Request review

### For Maintainers

**Monitoring CI:**
1. Go to "Actions" tab on GitHub
2. See all workflow runs
3. Click on run to see details
4. Debug failures

**Updating workflows:**
1. Edit `.github/workflows/*.yml`
2. Commit and push
3. Workflow updates automatically

---

## Common Patterns

### 1. Run on Push to Main
```yaml
on:
  push:
    branches: [main]
```

### 2. Run on Schedule (Cron)
```yaml
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight
```

### 3. Run Manually
```yaml
on:
  workflow_dispatch:  # Adds "Run workflow" button
```

### 4. Matrix Testing (Multiple Versions)
```yaml
strategy:
  matrix:
    python-version: [3.10, 3.11, 3.12]
    os: [ubuntu-latest, macos-latest, windows-latest]
```

### 5. Conditional Steps
```yaml
- name: Deploy
  if: github.ref == 'refs/heads/main'
  run: ./deploy.sh
```

### 6. Secrets
```yaml
- name: Deploy
  env:
    API_KEY: ${{ secrets.API_KEY }}  # From repo settings
  run: ./deploy.sh
```

---

## Benefits of GitHub Automation

### 1. Consistency
- Every PR follows same template
- Every issue has required information
- Code quality standards enforced

### 2. Quality Assurance
- Tests run automatically
- No broken code reaches main
- Security vulnerabilities caught early

### 3. Time Savings
- No manual testing needed
- Automated deployments
- Faster code reviews

### 4. Documentation
- CI logs show what was tested
- PR templates document changes
- Issue templates capture requirements

### 5. Collaboration
- Clear contribution process
- Standardized workflows
- Reduced back-and-forth

---

## Best Practices

### 1. Keep Workflows Fast
```yaml
# ✅ Good: Only run on changed files
- uses: dorny/paths-filter@v3

# ❌ Bad: Always run everything
- run: pytest  # Tests everything
```

### 2. Use Caching
```yaml
# ✅ Good: Cache dependencies
- uses: actions/cache@v5
  with:
    path: ~/.cache/pip
    key: ${{ hashFiles('requirements.txt') }}

# ❌ Bad: Install every time
- run: pip install -r requirements.txt
```

### 3. Fail Fast
```yaml
# ✅ Good: Cancel old runs
concurrency:
  cancel-in-progress: true

# ❌ Bad: Let all runs complete
```

### 4. Use Matrix for Multiple Versions
```yaml
# ✅ Good: Test multiple versions
strategy:
  matrix:
    python: [3.10, 3.11, 3.12]

# ❌ Bad: Only test one version
```

### 5. Separate Concerns
```yaml
# ✅ Good: Separate workflows
- backend-tests.yml
- frontend-tests.yml
- deploy.yml

# ❌ Bad: One giant workflow
- all-in-one.yml
```

---

## Debugging Workflows

### View Logs
1. Go to "Actions" tab
2. Click on workflow run
3. Click on job
4. Expand step to see logs

### Re-run Failed Jobs
1. Click "Re-run failed jobs" button
2. Or "Re-run all jobs" to start fresh

### Debug with SSH
```yaml
- name: Setup tmate session
  uses: mxschmitt/action-tmate@v3
  if: failure()  # Only on failure
```

### Local Testing
```bash
# Install act (runs GitHub Actions locally)
brew install act

# Run workflow locally
act pull_request
```

---

## Cost Considerations

### GitHub Actions Minutes

**Free tier:**
- Public repos: Unlimited
- Private repos: 2,000 minutes/month

**Optimization tips:**
1. Use caching (saves 50-80% time)
2. Cancel old runs (concurrency)
3. Path filtering (skip unnecessary runs)
4. Self-hosted runners (free, unlimited)

---

## Security Best Practices

### 1. Never Commit Secrets
```yaml
# ✅ Good: Use GitHub Secrets
env:
  API_KEY: ${{ secrets.API_KEY }}

# ❌ Bad: Hardcode secrets
env:
  API_KEY: "sk-1234567890"
```

### 2. Pin Action Versions
```yaml
# ✅ Good: Pin to commit SHA
- uses: actions/checkout@8e5e7e5a8f1e2c3d4e5f6a7b8c9d0e1f2a3b4c5d

# ⚠️ OK: Pin to major version
- uses: actions/checkout@v4

# ❌ Bad: Use latest
- uses: actions/checkout@main
```

### 3. Limit Permissions
```yaml
permissions:
  contents: read  # Only read access
  pull-requests: write  # Can comment on PRs
```

### 4. Review Third-Party Actions
- Check source code
- Verify maintainer
- Read reviews
- Use popular actions

---

## Creating Your Own Workflow

### Step 1: Create File
```bash
mkdir -p .github/workflows
touch .github/workflows/my-workflow.yml
```

### Step 2: Define Trigger
```yaml
name: My Workflow

on:
  pull_request:
    branches: [main]
```

### Step 3: Add Jobs
```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: npm test
```

### Step 4: Commit and Push
```bash
git add .github/workflows/my-workflow.yml
git commit -m "Add my workflow"
git push
```

### Step 5: Monitor
- Go to "Actions" tab
- See workflow run
- Debug if needed

---

## Resources

### Official Documentation
- [GitHub Actions](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [Issue Templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests)

### Marketplace
- [GitHub Actions Marketplace](https://github.com/marketplace?type=actions)
- Pre-built actions for common tasks

### Tools
- [act](https://github.com/nektos/act) - Run workflows locally
- [actionlint](https://github.com/rhysd/actionlint) - Lint workflow files

---

## Summary

The `.github` folder is your automation hub:

1. **Issue Templates** - Standardize bug reports and feature requests
2. **PR Templates** - Ensure consistent pull request descriptions
3. **GitHub Actions** - Automate testing, quality checks, and deployments
4. **Funding** - Support open source development
5. **Community Files** - Contributing guidelines, code of conduct

**Key Benefits:**
- ✅ Automated testing (no manual work)
- ✅ Consistent code quality
- ✅ Faster development cycle
- ✅ Better collaboration
- ✅ Reduced bugs in production

**Next Steps:**
1. Review existing workflows
2. Understand what each does
3. Customize for your needs
4. Add new workflows as needed

---

**Last Updated:** 2026-04-09  
**Questions?** Check GitHub Actions documentation or ask in discussions
