const { test, expect } = require('@playwright/test');
const CommonNavigation = require('../pages/CommonNavigation');

// =====================================================
// HELPERS
// =====================================================

function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Row whose cell is EXACTLY the given code (not just "contains").
function rowWithExactCode(page, code) {
    const exact = new RegExp(`^\\s*${escapeRegex(code)}\\s*$`, 'i');

    return page
        .locator('tr')
        .filter({ has: page.locator('td', { hasText: exact }) });
}

// Finds the exact record; pages forward if the report is alphabetical
// and the new record is not on the first page.
async function findExpenseRow(page, code, maxPages = 30) {

    const nextButton = page.locator(
        'button[aria-label*="Next" i], ' +
        'a[aria-label*="Next" i], ' +
        'button[title*="Next" i], ' +
        'a[title*="Next" i], ' +
        'a.t-Report-paginationLink--next, ' +
        'button.a-IRR-button--pagination'
    ).last();

    for (let pageNo = 1; pageNo <= maxPages; pageNo++) {

        const row = rowWithExactCode(page, code).first();

        const found = await row
            .waitFor({ state: 'visible', timeout: 4000 })
            .then(() => true)
            .catch(() => false);

        if (found) {
            console.log(`Exact Expense Type row found on report page ${pageNo}`);
            return row;
        }

        const canGoNext =
            (await nextButton.isVisible().catch(() => false)) &&
            (await nextButton.isEnabled().catch(() => false));

        if (!canGoNext) break;

        console.log(`Not on report page ${pageNo}, going to next page...`);

        await nextButton.click();
        await page.waitForTimeout(1200);
    }

    return null;
}

async function dumpRows(page, limit = 25) {
    const rows = page.locator('tr');
    const count = await rows.count();

    console.log(`Total rows on page: ${count}`);

    for (let i = 0; i < Math.min(count, limit); i++) {
        console.log(
            `Row ${i + 1}:`,
            (await rows.nth(i).innerText().catch(() => '<unreadable>'))
                .replace(/\s+/g, ' ')
                .trim()
        );
    }
}

// Only visible errors that contain text
async function collectErrors(scope) {
    const candidates = scope.locator(
        '.t-Form-error, ' +
        '.t-Form-errorMessage, ' +
        '.apex-item-error, ' +
        '.a-Form-error, ' +
        '.u-Error, ' +
        '.field-error, ' +
        '.t-Alert--danger, ' +
        '.t-Alert--error, ' +
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

async function closeExpenseDialogIfOpen(page, label) {

    const dialog = page
        .locator('.ui-dialog:visible')
        .filter({ has: page.locator('iframe[title*="Expense Type"]') })
        .first();

    if (await dialog.count()) {

        console.log(`${label}: popup still open, closing with X`);

        const closeButton = dialog.locator('.ui-dialog-titlebar-close');

        await closeButton.waitFor({ state: 'visible', timeout: 10000 });
        await closeButton.click();
    } else {
        console.log(`${label}: popup already closed`);
    }

    await page
        .locator('.ui-widget-overlay.ui-front')
        .first()
        .waitFor({ state: 'hidden', timeout: 15000 })
        .catch(() => {});

    await page.waitForTimeout(1000);
}

test('Common Module - Expense Type Add Search Edit Clear', async ({ page }) => {

    // =====================================================
    // MANUAL TEST DATA
    // =====================================================

    const data = {
        // LOGIN (manual)
        username: 'Subiksha',
        password: 'Subiksha@4321',

        code: 'ZAT',
        accountId: '2026509',
        description: 'EXPENSE FOR WATERWASH ZA',
        updatedAccountId: '202300'
    };

    console.log('Expense Type Data:', { ...data, password: '********' });


    // =====================================================
    // LOGIN
    // =====================================================

    await page.goto(
        'https://dowellapps.com:8443/ords/r/manerp/common/login',
        { waitUntil: 'domcontentloaded' }
    );

    console.log('Login page opened');

    await page.getByRole('textbox', { name: 'Username' }).fill(data.username);
    await page.getByRole('textbox', { name: 'Password' }).fill(data.password);

    await page.getByRole('button', { name: /Sign In|Login/i }).click();

    console.log('Login clicked');


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

    page.once('dialog', dialog => {
        console.log(`Dialog message: ${dialog.message()}`);
        dialog.dismiss().catch(() => {});
    });

    await commonMenuItem.click();

    console.log('COMMON ONLY - Mannai selected');

    await page.waitForTimeout(2000);


    // =====================================================
    // NAVIGATE TO EXPENSE TYPE
    // =====================================================

    const nav = new CommonNavigation(page);

    await nav.open('Expense Type');

    console.log('Expense Type screen opened');


    // =====================================================
    // NEW
    // =====================================================

    const newButton = page.getByRole('button', { name: /^New$/i }).first();

    await newButton.waitFor({ state: 'visible', timeout: 30000 });
    await newButton.click();

    console.log('New Expense Type clicked');


    // =====================================================
    // EXPENSE TYPE IFRAME
    // =====================================================

    const expenseIframe = page
        .locator('iframe[title="Expense Type"]:visible')
        .last();

    await expenseIframe.waitFor({ state: 'visible', timeout: 30000 });

    const frame = expenseIframe.contentFrame();

    console.log('Expense Type popup opened');


    // =====================================================
    // FILL ADD FORM
    // =====================================================

    const expenseCode = frame.getByRole('textbox', {
        name: 'Expense Code',
        exact: true
    });

    await expenseCode.waitFor({ state: 'visible', timeout: 30000 });
    await expenseCode.fill(data.code);

    console.log('Expense Code:', data.code);

    const accountId = frame.getByRole('textbox', {
        name: 'Account ID',
        exact: true
    });

    await accountId.fill(data.accountId);

    console.log('Account ID:', data.accountId);

    const description = frame.getByRole('textbox', {
        name: 'Expense Description',
        exact: true
    });

    await description.fill(data.description);

    console.log('Expense Description:', data.description);


    // =====================================================
    // VERIFY ENTERED DATA
    // =====================================================

    await expect(expenseCode).toHaveValue(data.code);
    await expect(accountId).toHaveValue(data.accountId);
    await expect(description).toHaveValue(data.description);

    console.log('Expense Type values verified');


    // =====================================================
    // SAVE
    // =====================================================

    await frame.getByRole('button', { name: 'Save', exact: true }).click();

    console.log('Expense Type Save clicked');

    await page.waitForTimeout(1500);


    // =====================================================
    // CHECK SAVE ERRORS (inside popup and main page)
    // =====================================================

    const saveErrors = [
        ...(await collectErrors(frame)),
        ...(await collectErrors(page))
    ];

    if (saveErrors.length > 0) {
        saveErrors.forEach((e, i) => console.log(`Save Error ${i + 1}: ${e}`));

        throw new Error(`Expense Type Save failed: ${saveErrors.join(' | ')}`);
    }

    await expenseIframe
        .waitFor({ state: 'hidden', timeout: 10000 })
        .catch(() => {
            console.log('Expense Type popup did not close automatically after Save');
        });

    await closeExpenseDialogIfOpen(page, 'After Save');


    // =====================================================
    // SEARCH (LOV)
    // =====================================================

    console.log('Opening Expense Type search...');

    const searchDropdown = page
        .getByRole('combobox', { name: /Expense Type/i })
        .first();

    await searchDropdown.waitFor({ state: 'visible', timeout: 30000 });
    await searchDropdown.click();

    console.log('Expense Type search opened');

    const searchDialog = page.getByRole('dialog').last();

    await searchDialog.waitFor({ state: 'visible', timeout: 30000 });

    console.log('Search dialog opened');

    const searchInput = searchDialog.getByRole('textbox').first();

    await searchInput.fill(data.code);
    await searchInput.press('Enter');

    console.log('Searching Expense Code:', data.code);

    await page.waitForTimeout(1500);


    // =====================================================
    // SELECT THE EXACT RECORD IN LOV
    // =====================================================

    const exactCode = new RegExp(`^\\s*${escapeRegex(data.code)}\\s*$`, 'i');

    let lovResult = searchDialog
        .locator('li, tr, td, span, a')
        .filter({ hasText: exactCode })
        .first();

    let lovFound = await lovResult
        .waitFor({ state: 'visible', timeout: 8000 })
        .then(() => true)
        .catch(() => false);

    if (!lovFound) {

        console.log('Exact code not found in LOV. Trying row that contains it...');

        lovResult = searchDialog
            .locator('li, tr')
            .filter({ hasText: data.code })
            .first();

        lovFound = await lovResult
            .waitFor({ state: 'visible', timeout: 15000 })
            .then(() => true)
            .catch(() => false);
    }

    if (!lovFound) {
        console.log('LOV TEXT:');
        console.log(await searchDialog.innerText().catch(() => ''));

        throw new Error(`Expense Type "${data.code}" was not found in the LOV.`);
    }

    console.log('Expense Code found in Search:', data.code);

    await lovResult.click();

    console.log('Expense Type search result selected');

    await searchDialog
        .waitFor({ state: 'hidden', timeout: 10000 })
        .catch(() => {});

    console.log(
        `Search value: "${await searchDropdown.inputValue().catch(() => '')}"`
    );


    // =====================================================
    // MAIN SEARCH BUTTON
    // =====================================================

    await page
        .getByRole('button', { name: /^Search$/i })
        .last()
        .click();

    console.log('Search button clicked');

    await page
        .locator('.u-Processing')
        .waitFor({ state: 'hidden', timeout: 10000 })
        .catch(() => {});

    await page.waitForTimeout(1500);


    // =====================================================
    // FIND THE EXACT CREATED ROW
    // =====================================================

    const resultRow = await findExpenseRow(page, data.code);

    if (!resultRow) {

        console.log('======================================');
        console.log(`EXACT EXPENSE TYPE ROW NOT FOUND: ${data.code}`);
        console.log('======================================');

        await dumpRows(page);

        throw new Error(
            `Expense Type "${data.code}" was not found in the report after Search.`
        );
    }

    console.log(
        'Row text:',
        (await resultRow.innerText().catch(() => '')).replace(/\s+/g, ' ').trim()
    );

    console.log('Expense Type record found after Save');


    // =====================================================
    // VERIFY SAVED RECORD
    // =====================================================

    await expect(resultRow).toContainText(data.code);
    await expect(resultRow).toContainText(data.description);

    console.log('Saved Expense Type record verified');


    // =====================================================
    // EDIT THE SAME RECORD
    // =====================================================

    let editLink = resultRow.getByRole('link', { name: /edit/i }).first();

    if (!(await editLink.count())) {

        editLink = resultRow
            .locator(
                'a[title*="Edit" i], ' +
                'a[aria-label*="Edit" i], ' +
                'a:has(img[alt*="Edit" i]), ' +
                'a[href*="edit" i]'
            )
            .first();

        if (!(await editLink.count())) {
            console.log('No Edit link matched by name. Using first link in row.');
            console.log('Row HTML:', (await resultRow.innerHTML()).slice(0, 800));

            editLink = resultRow.locator('a').first();
        }
    }

    await editLink.click({ timeout: 15000 });

    console.log('Edit clicked');


    // =====================================================
    // EDIT POPUP
    // =====================================================

    const editIframe = page
        .locator('iframe[title="Expense Type"]:visible')
        .last();

    await editIframe.waitFor({ state: 'visible', timeout: 30000 });

    const editFrame = editIframe.contentFrame();

    console.log('Expense Type Edit popup opened');

    const editExpenseCode = editFrame.getByRole('textbox', {
        name: 'Expense Code',
        exact: true
    });

    await editExpenseCode.waitFor({ state: 'visible', timeout: 30000 });

    await expect(editExpenseCode).toHaveValue(data.code);

    console.log('Opened Expense Code:', data.code);


    // =====================================================
    // UPDATE ACCOUNT ID
    // =====================================================

    const editAccountId = editFrame.getByRole('textbox', {
        name: 'Account ID',
        exact: true
    });

    await editAccountId.fill(data.updatedAccountId);

    console.log('Updated Account ID:', data.updatedAccountId);

    await editFrame.getByRole('button', {
        name: 'Update',
        exact: true
    }).click();

    console.log('Expense Type Update clicked');

    await page.waitForTimeout(2000);


    // =====================================================
    // CHECK UPDATE ERRORS
    // =====================================================

    const updateErrors = [
        ...(await collectErrors(editFrame)),
        ...(await collectErrors(page))
    ];

    if (updateErrors.length > 0) {
        updateErrors.forEach((e, i) => console.log(`Update Error ${i + 1}: ${e}`));

        throw new Error(
            `Expense Type Update failed: ${updateErrors.join(' | ')}`
        );
    }

    console.log('==========================================');
    console.log('Expense Type Update completed successfully');
    console.log('Expense Code:', data.code);
    console.log('Updated Account ID:', data.updatedAccountId);
    console.log('==========================================');


    // =====================================================
    // CLOSE UPDATE POPUP
    // =====================================================

    await closeExpenseDialogIfOpen(page, 'After Update');


    // =====================================================
    // CLEAR
    // =====================================================

    console.log('Clearing Expense Type...');

    const clearButton = page
        .getByRole('button', { name: /^Clear$/i })
        .last();

    if (await clearButton.isVisible().catch(() => false)) {
        await clearButton.click();

        console.log('Expense Type Clear clicked');
    }


    // =====================================================
    // FINAL RESULT
    // =====================================================

    console.log('==========================================');
    console.log('Expense Type Add Search Edit Clear completed successfully');
    console.log('==========================================');

});












