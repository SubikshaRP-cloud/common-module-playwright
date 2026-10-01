const { test, expect } = require('@playwright/test');
const CommonNavigation = require('../pages/CommonNavigation');

test('Common Module - Supplier Group Add Search Edit Clear', async ({ page }) => {

    // =====================================================
    // TEST DATA (change code before each run - duplicates are rejected)
    // =====================================================

    const data = {
        code: '102',
        name: 'Hund Spp 2p',
        franchise: 'Non Mannai Franchise',
        updatedName: 'Hund Spp 02'
    };

    console.log('Supplier Group Data:', data);


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
    // NAVIGATE TO SUPPLIER GROUP
    // =====================================================

    const nav = new CommonNavigation(page);

    await nav.open('Supplier Group');

    console.log('Supplier Group screen opened');


    // =====================================================
    // NEW
    // =====================================================

    await page.getByRole('button', { name: 'New', exact: true }).click();

    console.log('New button clicked');


    // =====================================================
    // SUPPLIER GROUP IFRAME
    // =====================================================

    const sgIframe = page.locator('iframe[title="Supplier Group"]').first();

    await sgIframe.waitFor({ state: 'visible', timeout: 30000 });

    const frame = sgIframe.contentFrame();


    // =====================================================
    // ENTER CODE
    // =====================================================

    const codeField = frame.getByRole('textbox', { name: 'Code', exact: true });

    await codeField.waitFor({ state: 'visible', timeout: 30000 });
    await codeField.fill(data.code);

    console.log(`Code: ${data.code}`);


    // =====================================================
    // ENTER SUPPLIER GROUP NAME
    // =====================================================

    const nameField = frame.getByRole('textbox', { name: 'Supplier Group Name', exact: true });

    await nameField.fill(data.name);

    console.log(`Supplier Group Name: ${data.name}`);


    // =====================================================
    // SELECT FRANCHISE (list opens on the main page, not in the iframe)
    // =====================================================

    await frame.getByRole('combobox', { name: 'Franchise' }).click();

    await page
        .getByRole('option', { name: data.franchise })
        .click();

    console.log(`Franchise: ${data.franchise}`);


    // =====================================================
    // SAVE (verified)
    // =====================================================

    await clickAndVerifyClosed(sgIframe, frame, 'Supplier Group', 'Save');


    // =====================================================
    // OPEN SUPPLIER GROUP SEARCH
    // =====================================================

    console.log('Opening Supplier Group search');

    const sgCombobox = page.getByRole('combobox', { name: 'Supplier Group Name' });

    await sgCombobox.waitFor({ state: 'visible', timeout: 30000 });
    await sgCombobox.click();

    const searchDialog = page.getByRole('dialog', { name: 'Search' });

    await searchDialog.waitFor({ state: 'visible', timeout: 30000 });

    console.log('Search dialog opened');


    // =====================================================
    // SEARCH USING THE SAME CREATED CODE
    // =====================================================

    const searchTextbox = searchDialog.getByRole('textbox').first();

    await searchTextbox.fill(data.code);

    console.log(`Searching Supplier Group Code: ${data.code}`);

    await searchTextbox.press('Enter');


    // =====================================================
    // SELECT SEARCH RESULT (exact cell first, then row fallback)
    // =====================================================

    const resultCell = page.getByRole('gridcell', { name: data.code, exact: true }).first();

    try {

        await resultCell.waitFor({ state: 'visible', timeout: 15000 });
        await resultCell.click();

        console.log(`Exact Code found: ${data.code}`);

    } catch {

        console.log(`Exact Code "${data.code}" not found, trying row match`);

        const resultRow = page
            .getByRole('row')
            .filter({ hasText: data.code })
            .first();

        await resultRow.waitFor({ state: 'visible', timeout: 15000 });

        const rowText = await resultRow.innerText();

        if (!rowText.toUpperCase().includes(data.code.toUpperCase())) {
            throw new Error(`Supplier Group "${data.code}" was not found after Save.`);
        }

        await resultRow.click();

        console.log(`Supplier Group selected from row: ${data.code}`);
    }


    // =====================================================
    // CLICK SEARCH
    // =====================================================

    await page.getByRole('button', { name: 'Search', exact: true }).click();

    console.log('Search button clicked');


    // =====================================================
    // FIND EXACT RESULT ROW AND VERIFY
    // =====================================================

    const sgRow = page
        .getByRole('row')
        .filter({ hasText: data.code })
        .first();

    await sgRow.waitFor({ state: 'visible', timeout: 30000 });

    const resultRowText = await sgRow.innerText();

    console.log(`Supplier Group result row: ${resultRowText}`);

    if (!resultRowText.toUpperCase().includes(data.code.toUpperCase())) {
        throw new Error(
            `Search returned an unexpected row. ` +
            `Expected "${data.code}" but found "${resultRowText}"`
        );
    }

    console.log(`Supplier Group record found: ${data.code}`);


    // =====================================================
    // EDIT ONLY INSIDE THE SAME ROW
    // =====================================================

    const rowEditButton = sgRow.getByRole('link', { name: 'Edit', exact: true });

    await rowEditButton.waitFor({ state: 'visible', timeout: 30000 });
    await rowEditButton.click();

    console.log('Edit clicked');


    // =====================================================
    // EDIT IFRAME
    // =====================================================

    const editIframe = page.locator('iframe[title="Supplier Group"]').first();

    await editIframe.waitFor({ state: 'visible', timeout: 30000 });

    const editFrame = editIframe.contentFrame();


    // =====================================================
    // VERIFY OPENED RECORD
    // =====================================================

    const editCode = editFrame.getByRole('textbox', { name: 'Code', exact: true });

    await editCode.waitFor({ state: 'visible', timeout: 30000 });

    const openedCode = await editCode.inputValue();

    console.log(`Opened Code: ${openedCode}`);

    if (openedCode.trim().toUpperCase() !== data.code.trim().toUpperCase()) {
        throw new Error(
            `Wrong Supplier Group opened. Expected "${data.code}" but found "${openedCode}"`
        );
    }

    console.log(`Correct Supplier Group opened: ${data.code}`);

    const editName = editFrame.getByRole('textbox', { name: 'Supplier Group Name', exact: true });

    await expect(editName).toHaveValue(data.name);

    console.log(`Verified Supplier Group Name: ${data.name}`);


    // =====================================================
    // UPDATE NAME
    // =====================================================

    await editName.fill(data.updatedName);

    // Blur the field so the application registers the value
    await editName.press('Tab');

    console.log(`Updated Supplier Group Name: ${data.updatedName}`);


    // =====================================================
    // UPDATE (verified)
    // =====================================================

    await clickAndVerifyClosed(editIframe, editFrame, 'Supplier Group Edit', 'Update');


    // =====================================================
    // CLEAR
    // =====================================================

    const clearButton = page.getByRole('button', { name: 'Clear', exact: true });

    await clearButton.waitFor({ state: 'visible', timeout: 30000 });
    await clearButton.click();

    console.log('Supplier Group search cleared');


    // =====================================================
    // COMPLETED
    // =====================================================

    console.log('======================================');
    console.log('SUPPLIER GROUP TEST COMPLETED SUCCESSFULLY');
    console.log('======================================');

});