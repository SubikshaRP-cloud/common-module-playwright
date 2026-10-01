const { test } = require('@playwright/test');
const CommonNavigation = require('../pages/CommonNavigation');

// =====================================================
// HELPERS
// =====================================================

function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Row whose cell is EXACTLY the given code (not just "contains").
// Header rows use <th>, so they are never matched.
function rowWithExactCode(page, code) {
    const exact = new RegExp(`^\\s*${escapeRegex(code)}\\s*$`, 'i');

    return page
        .locator('tr')
        .filter({
            has: page.locator('td', { hasText: exact })
        });
}

// Finds the exact record. The report is sorted alphabetically and a new
// record can land on a later page, so this pages forward until found.
async function findBankRow(page, code, maxPages = 30) {

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
            console.log(`Exact Bank row found on report page ${pageNo}`);
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

// Closes the visible Bank dialog with the X if it is still open
async function closeBankDialogIfOpen(page, label) {

    const dialog = page
        .locator('.ui-dialog:visible')
        .filter({ has: page.locator('iframe[title*="Bank"]') })
        .first();

    if (await dialog.count()) {

        console.log(`${label}: popup still open, closing with X`);

        const closeButton = dialog.locator('.ui-dialog-titlebar-close');

        await closeButton.waitFor({ state: 'visible', timeout: 10000 });
        await closeButton.click();
    } else {
        console.log(`${label}: popup already closed`);
    }

    const overlay = page.locator('.ui-widget-overlay.ui-front').first();

    await overlay
        .waitFor({ state: 'hidden', timeout: 15000 })
        .catch(() => {});

    await page.waitForTimeout(1000);
}

test('Common Module - Bank Add Search Edit Clear', async ({ page }) => {

    // =====================================================
    // MANUAL TEST DATA
    // =====================================================

    const data = {
        // LOGIN (manual)
        username: 'Subiksha',
        password: 'Subiksha@4321',

        code: 'ZAT',
        name: 'ZAT BANK',
        updatedEmail: 'xr@gmail.com'
    };

    console.log('Bank Data:', { ...data, password: '********' });


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
    // NAVIGATE TO BANK
    // =====================================================

    const nav = new CommonNavigation(page);

    await nav.open('Bank');

    console.log('Bank screen opened');


    // =====================================================
    // ADD NEW BANK
    // =====================================================

    await page.getByRole('button', { name: 'New', exact: true }).click();

    console.log('New button clicked');

    const bankIframe = page.locator('iframe[title*="Bank"]').first();

    await bankIframe.waitFor({ state: 'visible', timeout: 30000 });

    const frame = bankIframe.contentFrame();

    const bankCode = frame.getByRole('textbox', {
        name: 'Bank Code',
        exact: true
    });

    await bankCode.waitFor({ state: 'visible', timeout: 30000 });
    await bankCode.fill(data.code);

    console.log(`Bank Code entered: ${data.code}`);

    const bankName = frame.getByRole('textbox', {
        name: 'Bank Name',
        exact: true
    });

    await bankName.waitFor({ state: 'visible', timeout: 30000 });
    await bankName.fill(data.name);

    console.log(`Bank Name entered: ${data.name}`);

    await frame.getByRole('button', { name: 'Save', exact: true }).click();

    console.log('Bank Save clicked');

    await page.waitForTimeout(1500);

    await closeBankDialogIfOpen(page, 'After Save');


    // =====================================================
    // SEARCH BANK (LOV)
    // =====================================================

    console.log('Opening Bank search');

    const bankCombobox = page.getByRole('combobox', {
        name: 'Bank',
        exact: true
    });

    await bankCombobox.waitFor({ state: 'visible', timeout: 30000 });
    await bankCombobox.click();

    const searchDialog = page.getByRole('dialog', { name: 'Search' });

    await searchDialog.waitFor({ state: 'visible', timeout: 30000 });

    console.log('Search dialog opened');

    const searchTextbox = searchDialog.getByRole('textbox');

    await searchTextbox.fill(data.code);
    await searchTextbox.press('Enter');

    console.log(`Searching same Bank Code: ${data.code}`);

    await page.waitForTimeout(1500);


    // =====================================================
    // SELECT THE EXACT BANK FROM LOV RESULT
    // =====================================================

    const exactCode = new RegExp(`^\\s*${escapeRegex(data.code)}\\s*$`, 'i');

    // 1) an element whose whole text is the code
    let lovResult = searchDialog
        .locator('li, tr, td, span, a')
        .filter({ hasText: exactCode })
        .first();

    let lovFound = await lovResult
        .waitFor({ state: 'visible', timeout: 8000 })
        .then(() => true)
        .catch(() => false);

    // 2) fallback: a row/item that contains the code
    if (!lovFound) {

        console.log('Exact Bank Code not found in LOV. Trying row that contains it...');

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

        throw new Error(`Bank "${data.code}" was not found in the Bank LOV.`);
    }

    await lovResult.click();

    console.log(`Bank selected from LOV: ${data.code}`);

    await searchDialog
        .waitFor({ state: 'hidden', timeout: 10000 })
        .catch(() => {});

    console.log(
        `Bank combobox value: "${await bankCombobox.inputValue().catch(() => '')}"`
    );


    // =====================================================
    // MAIN SEARCH BUTTON
    // =====================================================

    await page.getByRole('button', {
        name: 'Search',
        exact: true
    }).first().click();

    console.log('Bank Search button clicked');

    await page
        .locator('.u-Processing')
        .waitFor({ state: 'hidden', timeout: 10000 })
        .catch(() => {});

    await page.waitForTimeout(1500);


    // =====================================================
    // FIND THE EXACT CREATED ROW (pages forward if needed)
    // =====================================================

    const bankRow = await findBankRow(page, data.code);

    if (!bankRow) {

        console.log('======================================');
        console.log(`EXACT BANK ROW NOT FOUND: ${data.code}`);
        console.log('======================================');

        await dumpRows(page);

        throw new Error(
            `Bank "${data.code}" was not found in the report after Search.`
        );
    }

    console.log(
        'Row text:',
        (await bankRow.innerText().catch(() => '')).replace(/\s+/g, ' ').trim()
    );

    console.log(`Same Bank record found: ${data.code}`);


    // =====================================================
    // EDIT THE SAME RECORD
    // =====================================================

    let editLink = bankRow.getByRole('link', { name: /edit/i }).first();

    if (!(await editLink.count())) {

        // Edit icon may have no accessible name - use title/alt/href/first link
        editLink = bankRow
            .locator(
                'a[title*="Edit" i], ' +
                'a[aria-label*="Edit" i], ' +
                'a:has(img[alt*="Edit" i]), ' +
                'a[href*="edit" i]'
            )
            .first();

        if (!(await editLink.count())) {
            console.log('No Edit link matched by name. Using first link in row.');
            console.log('Row HTML:', (await bankRow.innerHTML()).slice(0, 800));

            editLink = bankRow.locator('a').first();
        }
    }

    await editLink.click({ timeout: 15000 });

    console.log(`Edit clicked for Bank Code: ${data.code}`);


    // =====================================================
    // EDIT POPUP
    // =====================================================

    const editBankIframe = page
        .locator('iframe[title*="Bank"]:visible')
        .last();

    await editBankIframe.waitFor({ state: 'visible', timeout: 30000 });

    const editFrame = editBankIframe.contentFrame();

    const codeField = editFrame.getByRole('textbox', {
        name: 'Bank Code',
        exact: true
    });

    await codeField.waitFor({ state: 'visible', timeout: 30000 });

    const openedCode = await codeField.inputValue();

    console.log(`Opened Bank Code: ${openedCode}`);

    if (
        openedCode.trim().toUpperCase() !==
        data.code.trim().toUpperCase()
    ) {
        throw new Error(
            `Wrong Bank opened. Expected "${data.code}" but found "${openedCode}"`
        );
    }

    console.log(`Verified: Same Bank Code "${data.code}" opened`);


    // =====================================================
    // UPDATE EMAIL
    // =====================================================

    const emailField = editFrame.getByRole('textbox', {
        name: 'Email',
        exact: true
    });

    await emailField.waitFor({ state: 'visible', timeout: 30000 });
    await emailField.fill(data.updatedEmail);

    console.log(`Updated Email: ${data.updatedEmail}`);

    await editFrame.getByRole('button', {
        name: 'Update',
        exact: true
    }).click();

    console.log('Update clicked');

    await page.waitForTimeout(1500);

    await closeBankDialogIfOpen(page, 'After Update');


    // =====================================================
    // CLEAR
    // =====================================================

    const clearButton = page
        .getByRole('button', { name: 'Clear', exact: true })
        .first();

    await clearButton.waitFor({ state: 'visible', timeout: 30000 });
    await clearButton.click();

    console.log('Bank search cleared');


    // =====================================================
    // COMPLETED
    // =====================================================

    console.log('======================================');
    console.log('BANK ADD > SEARCH > EDIT SAME RECORD > UPDATE > CLEAR COMPLETED');
    console.log('======================================');

});
