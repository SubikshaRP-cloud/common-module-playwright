const { test: setup, expect } = require('@playwright/test');
const LoginPage = require('../pages/LoginPage');

const authFile = 'playwright/.auth/common.json';

const USERNAME = 'Subiksha';
const PASSWORD = 'Subiksha@4321';

setup('authenticate Common Module', async ({ page }) => {

    console.log('======================================');
    console.log('COMMON MODULE LOGIN');
    console.log('======================================');

    // =================================================
    // 1. LOGIN
    // =================================================

    await page.goto('/ords/r/manerp/aut129129/login', {
        waitUntil: 'domcontentloaded',
        timeout: 120000
    });

    console.log('Login page opened');

    const login = new LoginPage(page);

    await login.login(USERNAME, PASSWORD);

    console.log('Login completed');

    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.waitForTimeout(2000);

    console.log('Current URL:', page.url());

    // =================================================
    // 2. APPLICATION LAUNCHER
    // =================================================

    const launcher = page.locator('#L201948268465196672');

    await expect(launcher).toBeVisible({
        timeout: 30000
    });

    console.log('Application launcher visible');

    await launcher.click();

    await page.waitForTimeout(1000);

    // =================================================
    // 3. COMMON ONLY - MANNAI
    // =================================================

    const commonApp = page.getByRole('menuitem', {
        name: 'COMMON ONLY - Mannai'
    });

    await expect(commonApp).toBeVisible({
        timeout: 30000
    });

    console.log('COMMON ONLY - Mannai visible');

    await commonApp.click();

    await page.waitForTimeout(3000);

    console.log('COMMON ONLY - Mannai selected');

    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.waitForTimeout(3000);

    console.log(
        'Current URL after Common selection:',
        page.url()
    );

    // =================================================
    // 4. NAVIGATION BUTTON
    // =================================================

    const navButton = page.locator('#t_Button_navControl');

    await navButton.waitFor({
        state: 'visible',
        timeout: 30000
    });

    console.log('Navigation button visible');

    // =================================================
    // 5. CHECK WHETHER COMMON IS ALREADY VISIBLE
    // =================================================

    let commonMenu = page.getByRole('treeitem', {
        name: ' Common'
    }).first();

    const commonAlreadyVisible =
        await commonMenu.isVisible().catch(() => false);

    if (!commonAlreadyVisible) {

        console.log('Common menu is not visible');

        // -------------------------------------------------
        // Click hamburger
        // -------------------------------------------------

        await navButton.click({
            force: true
        });

        console.log('Navigation button clicked');

        await page.waitForTimeout(2000);

        // -------------------------------------------------
        // Recreate locator after navigation opens
        // -------------------------------------------------

        commonMenu = page.getByRole('treeitem', {
            name: ' Common'
        }).first();

        // -------------------------------------------------
        // Wait for Common
        // -------------------------------------------------

        try {

            await commonMenu.waitFor({
                state: 'visible',
                timeout: 15000
            });

        } catch (error) {

            console.log(
                'Common treeitem not visible after navigation click'
            );

            console.log(
                'Current URL:',
                page.url()
            );

            // Take screenshot for debugging
            await page.screenshot({
                path: 'test-results/common-navigation-debug.png',
                fullPage: true
            });

            throw error;
        }
    }

    // =================================================
    // 6. OPEN COMMON
    // =================================================

    console.log('Common menu visible');

    await commonMenu.click();

    await page.waitForTimeout(1000);

    console.log('Common menu opened');

    // =================================================
    // 7. SAVE AUTHENTICATION
    // =================================================

    await page.context().storageState({
        path: authFile
    });

    console.log('Authentication state saved');

    console.log('======================================');
    console.log('Common Module authentication completed');
    console.log('======================================');
});