const { test, expect } = require('@playwright/test');
const CommonNavigation = require('../pages/CommonNavigation');

test('Common Module - Parameter Add, Search, Add Parameter Domain, Clear', async ({ page }) => {

    // =====================================================
    // TEST DATA (change description before each run if duplicates are rejected)
    // =====================================================

    const data = {
        group: 'Finance',
        description: 'ytt',
        paramValue: '124'
    };

    console.log('Parameter Data:', data);


    // =====================================================
    // HELPER - CLICK SAVE/UPDATE AND VERIFY POPUP CLOSED
    // (retries once, then dumps popup text + screenshot and FAILS)
    // =====================================================

    async function clickAndVerifyClosed(iframeLocator, frame, label, buttonName) {

        const button = frame
            .getByRole('button', { name: buttonName, exact: true })
            .first();

        await button.waitFor({ state: 'visible', timeout: 30000 });

        let closed = false;

        for (let attempt = 1; attempt <= 2 && !closed; attempt++) {

            await button.click();
            console.log(`${label} ${buttonName} clicked (attempt ${attempt})`);

            closed = await iframeLocator
                .waitFor({ state: 'hidden', timeout: 10000 })
                .then(() => true)
                .catch(() => false);
        }

        if (!closed) {

            const errorTexts = (
                await frame
                    .locator('.t-Alert, .a-Notification, .t-Form-error, .a-Form-error, .apex-item-error, .u-danger-text')
                    .allInnerTexts()
                    .catch(() => [])
            )
                .map(t => t.trim())
                .filter(Boolean);

            const popupText = await frame
                .locator('body')
                .innerText()
                .catch(() => '(unreadable)');

            const shot = `test-results/${label.replace(/\s+/g, '-')}-not-saved.png`;
            await page.screenshot({ path: shot }).catch(() => {});

            console.log(`${label} error messages:`, errorTexts);
            console.log(`${label} popup text:\n${popupText}`);
            console.log(`Screenshot saved: ${shot}`);

            throw new Error(
                `${label} was NOT confirmed (${buttonName}). Popup still open. ${errorTexts.join(' | ')}`
            );
        }

        await page.locator('.ui-widget-overlay.ui-front')
            .waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});

        await page.locator('.u-Processing:visible')
            .waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});

        console.log(`${label} ${buttonName} confirmed (popup closed)`);

        await page.waitForTimeout(1000);
    }


    // =====================================================
    // HELPER - SEARCH PARAMETER BY DESCRIPTION
    // (opens the Parameter Group search, picks the result, clicks Search)
    // =====================================================

    const parametersRegion = page.getByRole('region', { name: 'Parameters' });

    async function searchParameter() {

        const groupCombobox = page.getByRole('combobox', { name: 'Parameter Group' });

        await groupCombobox.waitFor({ state: 'visible', timeout: 30000 });
        await groupCombobox.click();

        const searchDialog = page.getByRole('dialog', { name: 'Search' });

        await searchDialog.waitFor({ state: 'visible', timeout: 30000 });

        const searchTextbox = searchDialog.getByRole('textbox').first();

        await searchTextbox.fill(data.description);

        console.log(`Searching Parameter: ${data.description}`);

        await searchTextbox.press('Enter');

        // pick the result row that contains our description
        const resultCell = page
            .locator('.a-PopupLOV-results .a-GV-row')
            .filter({ hasText: data.description })
            .locator('td, th')
            .first();

        await resultCell.waitFor({ state: 'visible', timeout: 15000 });
        await resultCell.click();

        await parametersRegion
            .getByRole('button', { name: 'Search', exact: true })
            .click();

        console.log('Parameter Search button clicked');
    }


    // =====================================================
    // LOGIN
    // =====================================================

    await page.goto(
        'https://dowellapps.com:8443/ords/r/manerp/common/login',
        { waitUntil: 'domcontentloaded' }
    );

    await page.getByRole('textbox', { name: 'Username' }).fill('Subiksha');
    await page.getByRole('textbox', { name: 'Password' }).fill('Subiksha@4321');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();

    console.log('Login successful');


    // =====================================================
    // SWITCH ROLE
    // =====================================================

    const switchRoleBtn = page.locator('li.a-switchRole button').first();

    const commonMenuItem = page.getByRole('menuitem', {
        name: 'COMMON ONLY - Mannai'
    });

    await switchRoleBtn.waitFor({ state: 'visible', timeout: 30000 });
    await switchRoleBtn.click();

    const menuOpened = await commonMenuItem
        .waitFor({ state: 'visible', timeout: 5000 })
        .then(() => true)
        .catch(() => false);

    if (!menuOpened) {
        console.log('Switch Role menu did not open. Retrying...');
        await switchRoleBtn.click();
        await commonMenuItem.waitFor({ state: 'visible', timeout: 30000 });
    }

    await commonMenuItem.click();
    console.log('COMMON ONLY - Mannai selected');

    await page.waitForTimeout(1500);


    // =====================================================
    // NAVIGATE TO PARAMETER - PARAMETER DOMAIN
    // =====================================================

    const nav = new CommonNavigation(page);

    await nav.open('Parameter - Parameter Domain');

    console.log('Parameter screen opened');


    // =====================================================
    // 1. CREATE PARAMETER
    // =====================================================

    await parametersRegion
        .getByRole('button', { name: 'New', exact: true })
        .click();

    console.log('New button clicked');

    const paramIframe = page.locator('iframe[title="Parameters"]').first();

    await paramIframe.waitFor({ state: 'visible', timeout: 30000 });

    const paramFrame = paramIframe.contentFrame();

    // Parameter Group (list opens on the main page, not in the iframe)
    const groupField = paramFrame.getByRole('combobox', { name: 'Parameter Group' });

    await groupField.waitFor({ state: 'visible', timeout: 30000 });
    await groupField.click();

    await page.getByRole('option', { name: data.group, exact: true }).click();

    console.log(`Parameter Group: ${data.group}`);

    // Parameter Description
    const descField = paramFrame.getByRole('textbox', { name: 'Parameter Description' });

    await descField.fill(data.description);

    console.log(`Parameter Description: ${data.description}`);

    await clickAndVerifyClosed(paramIframe, paramFrame, 'Parameter', 'Save');


    // =====================================================
    // 2. SEARCH THE SAME PARAMETER
    // =====================================================

    await searchParameter();

    const parameterRow = page
        .getByRole('gridcell', { name: data.description, exact: true })
        .first();

    await parameterRow.waitFor({ state: 'visible', timeout: 30000 });

    console.log(`Parameter record found: ${data.description}`);

    await parameterRow.click();


    // =====================================================
    // 3. ADD PARAMETER DOMAIN FOR THE SELECTED PARAMETER
    // =====================================================

    // NOTE: this ID was recorded by codegen. If it changes between sessions,
    // replace it with the button's visible name, e.g.
    // page.getByRole('button', { name: 'New' }) inside the Parameter Domain region.
    const addDomainBtn = page.locator('#B405238618234373432');

    await addDomainBtn.waitFor({ state: 'visible', timeout: 30000 });
    await addDomainBtn.click();

    console.log('Add Parameter Domain clicked');

    const domainIframe = page.locator('iframe[title="Parameter Domain"]').first();

    await domainIframe.waitFor({ state: 'visible', timeout: 30000 });

    const domainFrame = domainIframe.contentFrame();

    const paramValue = domainFrame.getByRole('textbox', { name: 'Param Value' });

    await paramValue.waitFor({ state: 'visible', timeout: 30000 });
    await paramValue.fill(data.paramValue);

    // Blur the field so the application registers the value
    await paramValue.press('Tab');

    console.log(`Param Value: ${data.paramValue}`);

    await clickAndVerifyClosed(domainIframe, domainFrame, 'Parameter Domain', 'Save');


    // =====================================================
    // 4. SEARCH AGAIN TO CONFIRM THE PARAMETER IS STILL LISTED
    // =====================================================

    await searchParameter();

    await expect(
        page.getByRole('gridcell', { name: data.description, exact: true }).first()
    ).toBeVisible({ timeout: 30000 });

    console.log(`Parameter still found after adding domain: ${data.description}`);


    // =====================================================
    // CLEAR
    // =====================================================

    const clearButton = parametersRegion.getByRole('button', { name: 'Clear', exact: true });

    await clearButton.waitFor({ state: 'visible', timeout: 30000 });
    await clearButton.click();

    console.log('Parameter search cleared');


    // =====================================================
    // COMPLETED
    // =====================================================

    console.log('======================================');
    console.log('PARAMETER TEST COMPLETED SUCCESSFULLY');
    console.log('======================================');

});