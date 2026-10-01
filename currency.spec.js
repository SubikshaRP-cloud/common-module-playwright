const { test } = require('@playwright/test');

const CommonNavigation = require('../pages/CommonNavigation');

test('Common Module - Currency Add Search Edit Clear', async ({ page }) => {

    // ==========================================
    // TEST DATA (change code before each run - duplicates are rejected)
    // ==========================================

    const data = {
        code: 'GD',
        name: 'JYS',
        updatedName: 'JYS Updated'
    };

    console.log('Currency Data:', data);


    // ==========================================
    // HELPERS - EXACT CODE MATCHING
    // ("JF" must NOT match "DJF")
    // ==========================================

    function escapeRegExp(text) {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    const exactCode = new RegExp(
        `^\\s*${escapeRegExp(data.code)}\\s*$`,
        'i'
    );

    // Any cell (grid / table) whose whole text equals the code
    function exactCodeCellIn(scope) {
        return scope
            .locator('[role="gridcell"], [role="rowheader"], td')
            .filter({
                hasText: exactCode
            });
    }


    // ==========================================
    // LOGIN
    // ==========================================

    await page.goto(
        'https://dowellapps.com:8443/ords/r/manerp/common/login',
        {
            waitUntil: 'domcontentloaded'
        }
    );

    await page.getByRole('textbox', {
        name: 'Username'
    }).fill('Subiksha');

    await page.getByRole('textbox', {
        name: 'Password'
    }).fill('Subiksha@4321');

    await page.getByRole('button', {
        name: 'Sign In',
        exact: true
    }).click();

    console.log('Login successful');


    // ==========================================
    // SWITCH ROLE
    // ==========================================

    const switchRoleBtn = page
        .locator('li.a-switchRole button')
        .first();

    const commonMenuItem = page.getByRole(
        'menuitem',
        {
            name: 'COMMON ONLY - Mannai'
        }
    );

    await switchRoleBtn.waitFor({
        state: 'visible',
        timeout: 30000
    });

    await switchRoleBtn.click();


    // ==========================================
    // WAIT FOR COMMON ROLE MENU
    // ==========================================

    let menuOpened = await commonMenuItem
        .waitFor({
            state: 'visible',
            timeout: 5000
        })
        .then(() => true)
        .catch(() => false);


    if (!menuOpened) {

        console.log(
            'Switch Role menu did not open. Retrying...'
        );

        await switchRoleBtn.click();

        await commonMenuItem.waitFor({
            state: 'visible',
            timeout: 30000
        });
    }


    // ==========================================
    // SELECT COMMON ROLE
    // ==========================================

    await commonMenuItem.click();

    console.log(
        'COMMON ONLY - Mannai selected'
    );

    await page.waitForTimeout(1500);


    // ==========================================
    // NAVIGATE TO CURRENCY
    // ==========================================

    const nav = new CommonNavigation(page);

    await nav.open('Currency');

    console.log(
        'Currency screen opened'
    );


    // ==========================================
    // ADD NEW CURRENCY
    // ==========================================

    await page.getByRole('button', {
        name: 'New',
        exact: true
    }).click();

    console.log(
        'New button clicked'
    );


    // ==========================================
    // CURRENCY IFRAME
    // ==========================================

    const currencyIframe = page.locator(
        'iframe[title*="Currency"]'
    ).first();

    await currencyIframe.waitFor({
        state: 'visible',
        timeout: 30000
    });

    const frame = currencyIframe.contentFrame();


    // ==========================================
    // ENTER CURRENCY CODE
    // ==========================================

    const currencyCode = frame.getByRole(
        'textbox',
        {
            name: 'Currency Code',
            exact: true
        }
    );

    await currencyCode.waitFor({
        state: 'visible',
        timeout: 30000
    });

    await currencyCode.fill(
        data.code
    );

    console.log(
        `Currency Code: ${data.code}`
    );


    // ==========================================
    // ENTER CURRENCY NAME
    // ==========================================

    const currencyName = frame.getByRole(
        'textbox',
        {
            name: 'Currency Name',
            exact: true
        }
    );

    await currencyName.waitFor({
        state: 'visible',
        timeout: 30000
    });

    await currencyName.fill(
        data.name
    );

    console.log(
        `Currency Name: ${data.name}`
    );


    // ==========================================
    // SAVE CURRENCY
    // ==========================================

    const saveButton = frame.locator(
        '#B404122388573185526'
    );

    await saveButton.waitFor({
        state: 'visible',
        timeout: 30000
    });

    await saveButton.click();

    console.log('Currency Save clicked');


    // ==========================================
    // WAIT FOR SAVE PROCESSING
    // ==========================================

    await page.waitForTimeout(1500);


    // ==========================================
    // CHECK WHETHER CURRENCY POPUP IS STILL OPEN
    // ==========================================

    const currencyPopupStillOpen =
        await currencyIframe.isVisible().catch(() => false);


    if (currencyPopupStillOpen) {

        console.log(
            'Currency popup is still open after Save'
        );

        // Find the VISIBLE Currency dialog
        const visibleCurrencyDialog = page
            .locator('.ui-dialog:visible')
            .filter({
                has: page.locator('iframe[title*="Currency"]')
            })
            .first();

        // If the dialog is visible, click X
        if (await visibleCurrencyDialog.count()) {

            const closeButton =
                visibleCurrencyDialog.locator(
                    '.ui-dialog-titlebar-close'
                );

            await closeButton.waitFor({
                state: 'visible',
                timeout: 10000
            });

            await closeButton.click();

            console.log(
                'Currency popup closed using X'
            );
        }

    } else {

        console.log(
            'Currency popup already closed after Save'
        );
    }


    // ==========================================
    // WAIT FOR MODAL OVERLAY TO DISAPPEAR
    // ==========================================

    const overlay = page.locator(
        '.ui-widget-overlay.ui-front'
    );

    if (await overlay.count()) {

        await overlay.first().waitFor({
            state: 'hidden',
            timeout: 15000
        }).catch(() => {
            console.log(
                'Overlay already disappeared'
            );
        });
    }

    console.log(
        'Currency popup/overlay handling completed'
    );


    await page.waitForTimeout(1000);


    // ==========================================
    // SEARCH CURRENCY
    // ==========================================

    console.log(
        'Opening Currency search'
    );

    const currencyCombobox = page.getByRole(
        'combobox',
        {
            name: 'Currency',
            exact: true
        }
    );

    await currencyCombobox.waitFor({
        state: 'visible',
        timeout: 30000
    });

    await currencyCombobox.click();

    console.log(
        'Currency search opened'
    );


    // ==========================================
    // SEARCH DIALOG
    // ==========================================

    const searchDialog = page.getByRole(
        'dialog',
        {
            name: 'Search'
        }
    );

    await searchDialog.waitFor({
        state: 'visible',
        timeout: 30000
    });

    console.log(
        'Search dialog opened'
    );


    // ==========================================
    // ENTER SEARCH VALUE
    // ==========================================

    const searchTextbox = searchDialog.getByRole(
        'textbox'
    );

    await searchTextbox.fill(
        data.code
    );

    await searchTextbox.press(
        'Enter'
    );

    console.log(
        `Searching Currency Code: ${data.code}`
    );


    // ==========================================
    // SELECT EXACT CURRENCY FROM SEARCH RESULT
    // ==========================================

    const currencyResult = exactCodeCellIn(searchDialog).first();

    try {

        await currencyResult.waitFor({
            state: 'visible',
            timeout: 10000
        });

        await currencyResult.click();

        console.log(
            `Currency selected (exact match): ${data.code}`
        );

    } catch {

        console.log(
            `Exact Currency "${data.code}" not found in search dialog. Dialog content was:`
        );

        console.log(
            await searchDialog.innerText().catch(() => '(unreadable)')
        );

        throw new Error(
            `Currency "${data.code}" not found in search dialog`
        );
    }


    // ==========================================
    // SEARCH BUTTON
    // ==========================================

    await page.getByRole(
        'button',
        {
            name: 'Search',
            exact: true
        }
    ).click();

    console.log(
        'Currency Search button clicked'
    );


    // ==========================================
    // WAIT FOR SEARCH RESULT
    // ==========================================

    await page.waitForTimeout(1000);


    // ==========================================
    // FIND EXACT CURRENCY ROW
    // (row that has a cell equal to the code - not just containing it)
    // ==========================================

    const currencyRow = page
        .getByRole('row')
        .filter({
            has: page
                .locator('[role="gridcell"], [role="rowheader"], td')
                .filter({
                    hasText: exactCode
                })
        })
        .first();

    await currencyRow.waitFor({
        state: 'visible',
        timeout: 30000
    });

    const resultRowText = await currencyRow.innerText();

    console.log(
        `Currency result row: ${resultRowText.replace(/\s+/g, ' ').trim()}`
    );

    console.log(
        'Currency record found'
    );


    // ==========================================
    // EDIT (inside the SAME exact row only)
    // ==========================================

    await currencyRow.getByRole(
        'link',
        {
            name: 'Edit',
            exact: true
        }
    ).click();

    console.log(
        'Edit clicked'
    );


    // ==========================================
    // GET CURRENCY IFRAME AGAIN
    // ==========================================

    const editCurrencyIframe = page.locator(
        'iframe[title*="Currency"]'
    ).first();

    await editCurrencyIframe.waitFor({
        state: 'visible',
        timeout: 30000
    });

    const editFrame =
        editCurrencyIframe.contentFrame();


    // ==========================================
    // VERIFY OPENED CURRENCY CODE
    // ==========================================

    const codeField = editFrame.getByRole(
        'textbox',
        {
            name: 'Currency Code',
            exact: true
        }
    );

    await codeField.waitFor({
        state: 'visible',
        timeout: 30000
    });

    const openedCode =
        await codeField.inputValue();

    console.log(
        `Opened Currency Code: ${openedCode}`
    );


    if (
        openedCode.trim().toUpperCase() !==
        data.code.trim().toUpperCase()
    ) {

        throw new Error(
            `Wrong currency opened. Expected "${data.code}" but found "${openedCode}"`
        );
    }

    console.log(
        `Correct Currency opened: ${data.code}`
    );


    // ==========================================
    // UPDATE CURRENCY NAME
    // ==========================================

    const editCurrencyName =
        editFrame.getByRole(
            'textbox',
            {
                name: 'Currency Name',
                exact: true
            }
        );

    await editCurrencyName.waitFor({
        state: 'visible',
        timeout: 30000
    });

    await editCurrencyName.fill(
        data.updatedName
    );

    console.log(
        `Updated Currency Name: ${data.updatedName}`
    );


    // ==========================================
    // UPDATE
    // ==========================================

    await editFrame.getByRole(
        'button',
        {
            name: 'Update',
            exact: true
        }
    ).click();

    console.log(
        'Currency updated'
    );


    // ==========================================
    // WAIT FOR UPDATE PROCESSING
    // ==========================================

    await page.waitForTimeout(1500);


    // ==========================================
    // CHECK WHETHER EDIT POPUP IS STILL OPEN
    // ==========================================

    const editPopupStillOpen =
        await editCurrencyIframe.isVisible().catch(() => false);


    if (editPopupStillOpen) {

        console.log(
            'Currency edit popup is still open after Update'
        );

        const visibleEditDialog = page
            .locator('.ui-dialog:visible')
            .filter({
                has: page.locator('iframe[title*="Currency"]')
            })
            .first();

        if (await visibleEditDialog.count()) {

            const closeEditButton =
                visibleEditDialog.locator(
                    '.ui-dialog-titlebar-close'
                );

            await closeEditButton.waitFor({
                state: 'visible',
                timeout: 10000
            });

            await closeEditButton.click();

            console.log(
                'Currency edit popup closed using X'
            );
        }

    } else {

        console.log(
            'Currency edit popup already closed after Update'
        );
    }


    // ==========================================
    // WAIT FOR OVERLAY TO DISAPPEAR
    // ==========================================

    const updateOverlay = page.locator(
        '.ui-widget-overlay.ui-front'
    );

    if (await updateOverlay.count()) {

        await updateOverlay.first().waitFor({
            state: 'hidden',
            timeout: 15000
        }).catch(() => {
            console.log(
                'Update overlay already disappeared'
            );
        });
    }

    console.log(
        'Update popup/overlay handling completed'
    );


    await page.waitForTimeout(1000);


    // ==========================================
    // CLEAR
    // ==========================================

    const clearButton = page.getByRole(
        'button',
        {
            name: 'Clear',
            exact: true
        }
    );

    await clearButton.waitFor({
        state: 'visible',
        timeout: 30000
    });

    await clearButton.click();

    console.log(
        'Currency search cleared'
    );


    // ==========================================
    // COMPLETED
    // ==========================================

    console.log(
        '======================================'
    );

    console.log(
        'CURRENCY TEST COMPLETED SUCCESSFULLY'
    );

    console.log(
        '======================================'
    );

});