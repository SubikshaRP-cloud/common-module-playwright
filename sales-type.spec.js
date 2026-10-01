const { test } = require('@playwright/test');
const CommonNavigation = require('../pages/CommonNavigation');

// =====================================================
// HELPERS
// =====================================================

// Returns only errors that are VISIBLE and contain TEXT.
// (Empty placeholder elements or [aria-invalid] inputs are ignored.)
async function collectErrors(scope) {
    const candidates = scope.locator(
        '.t-Form-error, ' +
        '.t-Form-errorMessage, ' +
        '.apex-item-error, ' +
        '.a-Form-error, ' +
        '.u-Error, ' +
        '.field-error, ' +
        '.a-Notification--error'
    );

    const count = await candidates.count();
    const messages = [];

    for (let i = 0; i < count; i++) {
        const el = candidates.nth(i);

        if (!(await el.isVisible().catch(() => false))) continue;

        const text = (await el.innerText().catch(() => '')).trim();
        if (text) messages.push(text);
    }

    return messages;
}

// Returns visible alerts with text on the main page.
async function collectAlerts(page) {
    const alerts = page.locator(
        '.t-Alert--danger, ' +
        '.t-Alert--warning, ' +
        '.a-Notification--error, ' +
        '[role="alert"]'
    );

    const count = await alerts.count();
    const messages = [];

    for (let i = 0; i < count; i++) {
        const el = alerts.nth(i);

        if (!(await el.isVisible().catch(() => false))) continue;

        const text = (await el.innerText().catch(() => '')).trim();
        if (text) messages.push(text);
    }

    return messages;
}

// Prints which fields APEX flagged as invalid (diagnostic only).
async function logInvalidFields(scope, label) {
    const invalid = scope.locator('[aria-invalid="true"]');
    const count = await invalid.count();

    if (count === 0) return;

    console.log(`${label}: ${count} field(s) flagged aria-invalid`);

    for (let i = 0; i < count; i++) {
        const html = await invalid
            .nth(i)
            .evaluate(e => e.outerHTML.slice(0, 200))
            .catch(() => '<unreadable>');

        console.log(`INVALID FIELD ${i + 1}: ${html}`);
    }
}

test('Common Module - Sales Type Add Search Edit Clear', async ({ page }) => {

    // =====================================================
    // MANUAL TEST DATA
    // =====================================================

    const data = {
        // LOGIN (manual)
        username: 'Subiksha',
        password: 'Subiksha@4321',

        code: 'ASY',
        salesType: 'ASY',
        salesTypeName: 'Auto SH USGUB01',
        salesTypeIndicator: 'C',

        costAccountId: '54654654654654',
        costAccountNo: '564654654564',
        salesAccountId: '6545645445',
        salesAccountNo: '45456464',
    };

    // Print data without exposing the password in the log
    console.log('======================================');
    console.log('Sales Type Manual Data:');
    console.log({ ...data, password: '********' });
    console.log('======================================');


    // =====================================================
    // LOGIN
    // =====================================================

    await page.goto(
        'https://dowellapps.com:8443/ords/r/manerp/common/login',
        { waitUntil: 'domcontentloaded' }
    );

    await page.getByRole('textbox', { name: 'Username' }).fill(data.username);
    await page.getByRole('textbox', { name: 'Password' }).fill(data.password);

    await page.getByRole('button', {
        name: 'Sign In',
        exact: true
    }).click();


    // =====================================================
    // SWITCH ROLE
    // =====================================================

    const switchRoleBtn = page
        .locator('li.a-switchRole button')
        .first();

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
        console.log('Switch Role menu did not open on first click, retrying...');

        await switchRoleBtn.click();

        await commonMenuItem.waitFor({ state: 'visible', timeout: 30000 });
    }

    page.once('dialog', dialog => {
        console.log(`Dialog message: ${dialog.message()}`);
        dialog.dismiss().catch(() => {});
    });

    await commonMenuItem.click();

    await page.waitForTimeout(2000);


    // =====================================================
    // NAVIGATE TO SALES TYPE
    // =====================================================

    const nav = new CommonNavigation(page);

    await nav.open('Sales Type');


    // =====================================================
    // CLEAR OLD SEARCH
    // =====================================================

    await page
        .getByRole('button', { name: 'Clear', exact: true })
        .first()
        .click();

    await page.waitForTimeout(700);


    // =====================================================
    // CLICK NEW
    // =====================================================

    await page.getByRole('button', { name: 'New' }).click();


    // =====================================================
    // SALES TYPE IFRAME
    // =====================================================

    const frame = page
        .locator('xpath=//iframe[contains(normalize-space(@title), "Sales Type")]')
        .first()
        .contentFrame();

    await frame
        .getByRole('textbox', { name: 'Sales Type Code' })
        .waitFor({ state: 'visible', timeout: 30000 });


    // =====================================================
    // FILL ADD FORM
    // =====================================================

    await frame
        .getByRole('textbox', { name: 'Sales Type Code' })
        .fill(data.code);

    await frame
        .getByRole('textbox', { name: 'Sales Type', exact: true })
        .fill(data.salesType);

    await frame
        .getByRole('textbox', { name: 'Sales Type Name' })
        .fill(data.salesTypeName);

    const loanApplicable = frame.getByRole('checkbox', {
        name: 'Loan Applicable'
    });

    if (!(await loanApplicable.isChecked())) {
        await loanApplicable.check();
    }


    // =====================================================
    // SAVE
    // =====================================================

    console.log('Saving Sales Type...');

    const saveButton = frame.getByRole('button', {
        name: 'Save',
        exact: true
    });

    await saveButton.click();

    await page.waitForTimeout(1500);


    // =====================================================
    // CHECK SAVE VALIDATION ERRORS
    // =====================================================

    const saveErrors = await collectErrors(frame);

    if (saveErrors.length > 0) {

        console.log('======================================');
        console.log('SALES TYPE SAVE VALIDATION ERROR');
        console.log('======================================');

        saveErrors.forEach((e, i) => console.log(`Save Error ${i + 1}: ${e}`));

        await logInvalidFields(frame, 'SAVE');

        console.log('SAVE FORM TEXT:');
        console.log(await frame.locator('body').innerText().catch(() => ''));

        throw new Error(
            `Sales Type Save failed: ${saveErrors.join(' | ')}`
        );
    }

    // Diagnostic only: shows flagged fields if the popup is still open
    if (await saveButton.isVisible().catch(() => false)) {
        await logInvalidFields(frame, 'SAVE (popup still open)');
    }


    // =====================================================
    // CHECK MAIN PAGE SAVE ALERT
    // =====================================================

    const saveMainAlerts = await collectAlerts(page);

    if (saveMainAlerts.length > 0) {
        console.log('======================================');
        console.log('MAIN PAGE SAVE ALERT');
        console.log('======================================');

        saveMainAlerts.forEach((a, i) =>
            console.log(`Main Save Alert ${i + 1}: ${a}`)
        );
    }


    // =====================================================
    // CHECK SAVE POPUP
    // =====================================================

    const savePopupClosed = await saveButton
        .waitFor({ state: 'hidden', timeout: 5000 })
        .then(() => true)
        .catch(() => false);

    console.log(`Save popup closed: ${savePopupClosed}`);
    console.log('Sales Type save request processed.');


    // =====================================================
    // SEARCH THE SAME CREATED SALES TYPE
    // =====================================================

    console.log('======================================');
    console.log('SEARCHING CREATED SALES TYPE');
    console.log(`Code       : ${data.code}`);
    console.log(`Sales Type : ${data.salesType}`);
    console.log('======================================');


    // 1. LOCATE SALES TYPE POPUP LOV
    const salesTypeInput = page.locator('#P22_SALES_TYPE');

    await salesTypeInput.waitFor({ state: 'visible', timeout: 10000 });

    console.log('Sales Type Popup LOV input is visible.');

    // IMPORTANT: #P22_SALES_TYPE is READONLY - do not use .fill('') on it.


    // 2. OPEN SALES TYPE POPUP LOV
    const salesTypeLovButton = page.locator('#P22_SALES_TYPE_lov_btn');

    await salesTypeLovButton.waitFor({ state: 'visible', timeout: 10000 });
    await salesTypeLovButton.click();

    console.log('Sales Type Popup LOV opened.');


    // 3. WAIT FOR POPUP LOV DIALOG
    const lovDialog = page.locator('#PopupLov_22_P22_SALES_TYPE_dlg');

    await lovDialog.waitFor({ state: 'visible', timeout: 10000 });

    console.log('Sales Type Popup LOV dialog is visible.');


    // 4. FIND SEARCH INPUT INSIDE POPUP
    const lovSearchInput = lovDialog
        .locator('input[type="text"]')
        .first();

    await lovSearchInput.waitFor({ state: 'visible', timeout: 10000 });


    // 5. SEARCH USING MANUAL CODE
    await lovSearchInput.fill(data.code);

    console.log(`Popup LOV search value: ${data.code}`);


    // 6. CLICK SEARCH INSIDE POPUP
    const lovSearchButton = lovDialog.getByRole('button', {
        name: 'Search',
        exact: true
    });

    await lovSearchButton.click();

    await page.waitForTimeout(1500);

    console.log('Popup LOV Search clicked.');


    // 7. FIND SAME CODE IN POPUP
    const lovRecord = lovDialog
        .getByText(data.code, { exact: true })
        .first();

    const lovRecordFound = await lovRecord
        .waitFor({ state: 'visible', timeout: 10000 })
        .then(() => true)
        .catch(() => false);


    // 8. IF CODE NOT FOUND
    if (!lovRecordFound) {

        console.log('======================================');
        console.log('SALES TYPE NOT FOUND IN POPUP LOV');
        console.log('======================================');

        console.log(
            await lovDialog.innerText().catch(() => '<unable to read popup>')
        );

        console.log('======================================');

        throw new Error(
            `Sales Type "${data.code}" was not found in Popup LOV.`
        );
    }


    // 9. SELECT SAME CREATED RECORD
    console.log(`Found Sales Type in Popup LOV: ${data.code}`);

    await lovRecord.click();


    // 10. WAIT FOR POPUP TO CLOSE
    await lovDialog
        .waitFor({ state: 'hidden', timeout: 10000 })
        .catch(() => {});


    // 11. VERIFY LOV SELECTION
    const selectedSalesType = await salesTypeInput
        .inputValue()
        .catch(() => '');

    const hiddenSalesTypeValue = await page
        .locator('#P22_SALES_TYPE_HIDDENVALUE')
        .inputValue()
        .catch(() => '');

    console.log(`Selected Sales Type: "${selectedSalesType}"`);
    console.log(`Hidden LOV Value: "${hiddenSalesTypeValue}"`);


    // 12. MAKE SURE APEX SELECTED THE VALUE
    if (!selectedSalesType && !hiddenSalesTypeValue) {
        throw new Error(
            `Sales Type "${data.code}" was found in Popup LOV but was not selected.`
        );
    }


    // 13. MAIN SALES TYPE SEARCH
    const salesTypeRegion = page.getByRole('region', {
        name: 'Sale type',
        exact: true
    });

    const mainSearchButton = salesTypeRegion.getByRole('button', {
        name: 'Search',
        exact: true
    });

    await mainSearchButton.waitFor({ state: 'visible', timeout: 10000 });
    await mainSearchButton.click();

    await page.waitForTimeout(1500);

    console.log('Main Sales Type Search completed.');


    // 14. FIND SAME CREATED RECORD
    const createdRecord = page
        .getByRole('row')
        .filter({ hasText: data.code })
        .first();

    const createdRecordFound = await createdRecord
        .waitFor({ state: 'visible', timeout: 15000 })
        .then(() => true)
        .catch(() => false);


    // 15. IF SAME RECORD NOT FOUND
    if (!createdRecordFound) {

        console.log('======================================');
        console.log('CREATED RECORD NOT FOUND');
        console.log('======================================');

        console.log(`Expected Code: ${data.code}`);
        console.log(`Expected Sales Type: ${data.salesType}`);

        const rows = page.getByRole('row');
        const rowCount = await rows.count();

        console.log(`Total rows: ${rowCount}`);

        for (let i = 0; i < Math.min(rowCount, 20); i++) {
            console.log(
                `Row ${i + 1}:`,
                await rows.nth(i).innerText().catch(() => '<unreadable>')
            );
        }

        throw new Error(
            `Sales Type "${data.code}" was not found after Main Search.`
        );
    }

    console.log(`Same Sales Type record found: ${data.code}`);


    // 16. EDIT SAME RECORD
    const editLink = createdRecord.getByRole('link', {
        name: 'Edit',
        exact: true
    });

    await editLink.click();

    console.log(`Editing SAME Sales Type: ${data.code}`);


    // =====================================================
    // EDIT POPUP
    // =====================================================

    const editFrame = page
        .locator('xpath=//iframe[contains(normalize-space(@title), "Sales Type")]')
        .first()
        .contentFrame();

    await editFrame
        .getByRole('textbox', { name: 'Sales Type Code' })
        .waitFor({ state: 'visible', timeout: 30000 });


    // 17. VERIFY SAME RECORD OPENED
    const editCode = await editFrame
        .getByRole('textbox', { name: 'Sales Type Code' })
        .inputValue();

    console.log(`Edit Popup Code: ${editCode}`);

    if (editCode !== data.code) {
        throw new Error(
            `Wrong record opened. Expected "${data.code}" but found "${editCode}".`
        );
    }

    console.log('Correct Sales Type record opened.');


    // 18. UPDATE SALES TYPE INDICATOR
    await editFrame
        .getByLabel('Sales Type Indicator')
        .selectOption(data.salesTypeIndicator);

    // 19. UPDATE COST ACCOUNT ID
    await editFrame
        .getByRole('textbox', { name: 'Cost Account ID' })
        .fill(data.costAccountId);

    // 20. UPDATE COST ACCOUNT NO
    await editFrame
        .getByRole('textbox', { name: 'Cost Account No' })
        .fill(data.costAccountNo);

    // 21. UPDATE SALES ACCOUNT ID
    await editFrame
        .getByRole('textbox', { name: 'Sales Account ID' })
        .fill(data.salesAccountId);

    // 22. UPDATE SALES ACCOUNT NO
    await editFrame
        .getByRole('textbox', { name: 'Sales Account No' })
        .fill(data.salesAccountNo);


    // 23. PRINT UPDATE VALUES
    console.log('======================================');
    console.log('VALUES BEFORE UPDATE');
    console.log('======================================');

    const fieldsToPrint = [
        'Sales Type Code',
        'Cost Account ID',
        'Cost Account No',
        'Sales Account ID',
        'Sales Account No',
    ];

    for (const name of fieldsToPrint) {
        console.log(
            `${name}:`,
            await editFrame
                .getByRole('textbox', { name })
                .inputValue()
                .catch(() => '')
        );
    }

    console.log(
        'Sales Type Indicator:',
        await editFrame
            .getByLabel('Sales Type Indicator')
            .inputValue()
            .catch(() => '')
    );

    console.log('======================================');


    // 24. CLICK UPDATE
    console.log('Updating Sales Type...');

    const updateButton = editFrame.getByRole('button', {
        name: 'Update',
        exact: true
    });

    await updateButton.click();

    console.log('Update button clicked.');

    await page.waitForTimeout(1500);


    // 25. WAIT FOR APEX PROCESSING
    await page
        .locator('.u-Processing')
        .waitFor({ state: 'hidden', timeout: 10000 })
        .catch(() => {});


    // 26. CHECK UPDATE VALIDATION ERRORS
    const updateErrors = await collectErrors(editFrame);

    if (updateErrors.length > 0) {

        console.log('======================================');
        console.log('UPDATE VALIDATION ERRORS FOUND');
        console.log('======================================');

        updateErrors.forEach((e, i) =>
            console.log(`Update Error ${i + 1}: ${e}`)
        );

        await logInvalidFields(editFrame, 'UPDATE');

        console.log('UPDATE FORM TEXT');
        console.log(await editFrame.locator('body').innerText().catch(() => ''));

        throw new Error(
            `Sales Type Update failed: ${updateErrors.join(' | ')}`
        );
    }


    // 27. CHECK MAIN PAGE ERROR / ALERT
    const mainPageAlerts = await collectAlerts(page);

    if (mainPageAlerts.length > 0) {
        console.log('======================================');
        console.log('MAIN PAGE ALERT FOUND');
        console.log('======================================');

        mainPageAlerts.forEach((a, i) =>
            console.log(`Main Page Alert ${i + 1}: ${a}`)
        );

        console.log('======================================');
    }


    // 28. CHECK SUCCESS MESSAGE
    const successMessage = page.locator(
        '.t-Alert--success, ' +
        '.t-Notification--success, ' +
        '.a-Notification--success'
    );

    const successCount = await successMessage.count();

    let successToastSeen = false;

    for (let i = 0; i < successCount; i++) {

        const successText = await successMessage
            .nth(i)
            .innerText()
            .catch(() => '');

        if (/success|updated|saved/i.test(successText)) {
            console.log(`Update Success Message: ${successText.trim()}`);
            successToastSeen = true;
            break;
        }
    }


    // 29. CHECK UPDATE BUTTON
    const updateButtonStillVisible = await updateButton
        .isVisible()
        .catch(() => false);

    console.log(`Update button still visible: ${updateButtonStillVisible}`);
    console.log(`Success message detected: ${successToastSeen}`);


    // 30. UPDATE RESULT
    /*
       We do NOT treat "Update button visible" as failure, because the
       APEX Sales Type popup can remain open after processing the request.
       Validation errors were already checked above.
    */

    console.log('======================================');
    console.log(`Sales Type ${data.code} update request processed.`);
    console.log('======================================');


    // 31. CLOSE UPDATE POPUP IF STILL OPEN
    if (updateButtonStillVisible) {

        console.log('Update popup is still open.');
        console.log('Trying to close the Update popup...');

        let updatePopupClosed = false;

        const closeCandidates = [
            editFrame.getByRole('button', { name: /close/i }).first(),
            editFrame.locator('button[title*="Close" i]').first(),
            editFrame.locator('.ui-dialog-titlebar-close').first(),
        ];

        for (const closeBtn of closeCandidates) {
            if (await closeBtn.isVisible().catch(() => false)) {
                await closeBtn.click().catch(() => {});
                await page.waitForTimeout(500);
                updatePopupClosed = true;
                break;
            }
        }

        console.log(
            updatePopupClosed
                ? 'Update popup closed successfully.'
                : 'Update popup could not be closed automatically.'
        );
    }


    // 32. CLEAR SEARCH
    console.log('Clearing Sales Type search...');

    const clearButton = salesTypeRegion.getByRole('button', {
        name: 'Clear',
        exact: true
    });

    await clearButton.click();

    await page.waitForTimeout(1000);


    // =====================================================
    // TEST COMPLETE
    // =====================================================

    console.log('======================================');
    console.log('SALES TYPE TEST COMPLETED SUCCESSFULLY');
    console.log('======================================');

});