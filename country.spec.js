const { test, expect } = require('@playwright/test');
const CommonNavigation = require('../pages/CommonNavigation');

test('Common Module - Country Add Search Edit Clear', async ({ page }) => {

    // =====================================================
    // TEST DATA (change code before each run - duplicates are rejected)
    // =====================================================

    const data = {
        code: 'WES',
        name: 'WE BEN',
        nationality: 'BEN',
        updatedNationality: 'BEN Updated'
    };

    console.log('Country Data:', data);


    // =====================================================
    // HELPER - CLICK SAVE/UPDATE AND VERIFY POPUP CLOSED
    // (retries once, then dumps popup text + screenshot and FAILS)
    // =====================================================

    async function clickAndVerifyClosed(
        iframeLocator,
        frame,
        label,
        buttonName,
        fallbackSelector
    ) {

        const roleButton = frame.getByRole(
            'button',
            {
                name: buttonName,
                exact: true
            }
        );

        let button = roleButton.first();

        if (!(await roleButton.count()) && fallbackSelector) {

            console.log(
                `${label}: "${buttonName}" role button not found, using fallback selector`
            );

            button = frame.locator(fallbackSelector).first();
        }

        await button.waitFor({
            state: 'visible',
            timeout: 30000
        });

        let closed = false;

        for (let attempt = 1; attempt <= 2 && !closed; attempt++) {

            await button.click();

            console.log(
                `${label} ${buttonName} clicked (attempt ${attempt})`
            );

            closed = await iframeLocator
                .waitFor({
                    state: 'hidden',
                    timeout: 10000
                })
                .then(() => true)
                .catch(() => false);
        }

        if (!closed) {

            const errorTexts = (
                await frame
                    .locator(
                        '.t-Alert, .a-Notification, .t-Form-error, .a-Form-error, .apex-item-error, .u-danger-text'
                    )
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

            await page.screenshot({
                path: shot
            }).catch(() => {});

            console.log(
                `${label} error messages:`,
                errorTexts
            );

            console.log(
                `${label} popup text:\n${popupText}`
            );

            console.log(
                `Screenshot saved: ${shot}`
            );

            throw new Error(
                `${label} was NOT confirmed (${buttonName}). Popup still open. ${errorTexts.join(' | ')}`
            );
        }

        await page.locator(
            '.ui-widget-overlay.ui-front'
        ).waitFor({
            state: 'hidden',
            timeout: 30000
        }).catch(() => {});

        await page.locator(
            '.u-Processing:visible'
        ).waitFor({
            state: 'hidden',
            timeout: 30000
        }).catch(() => {});

        console.log(
            `${label} ${buttonName} confirmed (popup closed)`
        );

        await page.waitForTimeout(1000);
    }


    // =====================================================
    // LOGIN
    // =====================================================

    await page.goto(
        'https://dowellapps.com:8443/ords/r/manerp/common/login',
        {
            waitUntil: 'domcontentloaded'
        }
    );

    await page
        .getByRole('textbox', { name: 'Username' })
        .fill('Subiksha');

    await page
        .getByRole('textbox', { name: 'Password' })
        .fill('Subiksha@4321');

    await page
        .getByRole('button', {
            name: 'Sign In',
            exact: true
        })
        .click();

    console.log('Login successful');


    // =====================================================
    // SWITCH ROLE
    // =====================================================

    const switchRoleBtn = page
        .locator('li.a-switchRole button')
        .first();

    const commonMenuItem = page
        .getByRole('menuitem', {
            name: 'COMMON ONLY - Mannai'
        });

    await switchRoleBtn.waitFor({
        state: 'visible',
        timeout: 30000
    });

    await switchRoleBtn.click();


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


    // =====================================================
    // SELECT COMMON ROLE
    // =====================================================

    await commonMenuItem.click();

    console.log(
        'COMMON ONLY - Mannai selected'
    );

    await page.waitForTimeout(1500);


    // =====================================================
    // NAVIGATE TO COUNTRY
    // =====================================================

    const nav = new CommonNavigation(page);

    await nav.open('Country');

    console.log('Country screen opened');


    // =====================================================
    // NEW
    // =====================================================

    await page
        .getByRole('button', {
            name: 'New',
            exact: true
        })
        .click();

    console.log('New button clicked');


    // =====================================================
    // COUNTRY IFRAME
    // =====================================================

    const countryIframe = page
        .locator('iframe[title="Country"]')
        .first();

    await countryIframe.waitFor({
        state: 'visible',
        timeout: 30000
    });

    const frame = countryIframe.contentFrame();


    // =====================================================
    // ENTER COUNTRY CODE
    // =====================================================

    const countryCode = frame
        .getByRole('textbox', {
            name: 'Country Code',
            exact: true
        });

    await countryCode.waitFor({
        state: 'visible',
        timeout: 30000
    });

    await countryCode.fill(data.code);

    console.log(
        `Country Code: ${data.code}`
    );


    // =====================================================
    // ENTER COUNTRY NAME
    // =====================================================

    const countryName = frame
        .getByRole('textbox', {
            name: 'Country Name',
            exact: true
        });

    await countryName.fill(data.name);

    console.log(
        `Country Name: ${data.name}`
    );


    // =====================================================
    // ENTER NATIONALITY
    // =====================================================

    const nationality = frame
        .getByRole('textbox', {
            name: 'Nationality',
            exact: true
        });

    await nationality.fill(data.nationality);

    // Blur the field so the application registers the value
    await nationality.press('Tab');

    console.log(
        `Nationality: ${data.nationality}`
    );


    // =====================================================
    // SAVE (verified)
    // =====================================================

    await clickAndVerifyClosed(
        countryIframe,
        frame,
        'Country',
        'Save',
        '#B403208745739666443'
    );


    // =====================================================
    // OPEN COUNTRY SEARCH
    // =====================================================

    console.log('Opening Country search');

    const countryCombobox = page
        .getByRole('combobox', {
            name: 'Country',
            exact: true
        });

    await countryCombobox.waitFor({
        state: 'visible',
        timeout: 30000
    });

    await countryCombobox.click();

    console.log('Country search opened');


    // =====================================================
    // SEARCH DIALOG
    // =====================================================

    const searchDialog = page
        .getByRole('dialog', {
            name: 'Search'
        });

    await searchDialog.waitFor({
        state: 'visible',
        timeout: 30000
    });

    console.log('Search dialog opened');


    // =====================================================
    // SEARCH USING THE SAME CREATED CODE
    // =====================================================

    const searchTextbox = searchDialog
        .getByRole('textbox')
        .first();

    await searchTextbox.fill(data.code);

    console.log(
        `Searching Country Code: ${data.code}`
    );

    await searchTextbox.press('Enter');


    // =====================================================
    // WAIT FOR SEARCH RESULT
    // =====================================================

    const searchResultCode = searchDialog
        .getByText(data.code, {
            exact: true
        })
        .first();

    try {

        await searchResultCode.waitFor({
            state: 'visible',
            timeout: 15000
        });

        console.log(
            `Exact Country Code found: ${data.code}`
        );

        await searchResultCode.click();

    } catch {

        console.log(
            `Exact Country Code "${data.code}" not found.`
        );

        const resultRow = searchDialog
            .getByRole('row')
            .filter({
                hasText: data.code
            })
            .first();

        await resultRow.waitFor({
            state: 'visible',
            timeout: 15000
        });

        const rowText = await resultRow.innerText();

        console.log(
            `Search result row: ${rowText}`
        );

        if (
            !rowText
                .toUpperCase()
                .includes(data.code.toUpperCase())
        ) {

            throw new Error(
                `Country "${data.code}" was not found after Save.`
            );
        }

        await resultRow.click();

        console.log(
            `Country selected from row: ${data.code}`
        );
    }


    // =====================================================
    // CLICK SEARCH
    // =====================================================

    await page
        .getByRole('button', {
            name: 'Search',
            exact: true
        })
        .click();

    console.log(
        'Country Search button clicked'
    );


    // =====================================================
    // FIND EXACT COUNTRY RESULT ROW
    // =====================================================

    const countryRow = page
        .getByRole('row')
        .filter({
            hasText: data.code
        })
        .first();

    await countryRow.waitFor({
        state: 'visible',
        timeout: 30000
    });

    const resultRowText = await countryRow.innerText();

    console.log(
        `Country result row: ${resultRowText}`
    );


    // =====================================================
    // VERIFY SEARCH RESULT REALLY CONTAINS OUR CODE
    // =====================================================

    if (
        !resultRowText
            .toUpperCase()
            .includes(data.code.toUpperCase())
    ) {

        throw new Error(
            `Search returned an unexpected Country row. ` +
            `Expected "${data.code}" but found "${resultRowText}"`
        );
    }

    console.log(
        `Country record found: ${data.code}`
    );


    // =====================================================
    // EDIT ONLY INSIDE THE SAME ROW
    // =====================================================

    const rowEditButton = countryRow
        .getByRole('link', {
            name: 'Edit',
            exact: true
        });

    await rowEditButton.waitFor({
        state: 'visible',
        timeout: 30000
    });

    await rowEditButton.click();

    console.log('Edit clicked');


    // =====================================================
    // EDIT COUNTRY IFRAME
    // =====================================================

    const editCountryIframe = page
        .locator('iframe[title="Country"]')
        .first();

    await editCountryIframe.waitFor({
        state: 'visible',
        timeout: 30000
    });

    const editCountryFrame =
        editCountryIframe.contentFrame();


    // =====================================================
    // VERIFY OPENED COUNTRY CODE
    // =====================================================

    const editCountryCode =
        editCountryFrame.getByRole(
            'textbox',
            {
                name: 'Country Code',
                exact: true
            }
        );

    await editCountryCode.waitFor({
        state: 'visible',
        timeout: 30000
    });

    const openedCountryCode =
        await editCountryCode.inputValue();

    console.log(
        `Opened Country Code: ${openedCountryCode}`
    );


    if (
        openedCountryCode
            .trim()
            .toUpperCase() !==
        data.code
            .trim()
            .toUpperCase()
    ) {

        throw new Error(
            `Wrong Country opened. ` +
            `Expected "${data.code}" ` +
            `but found "${openedCountryCode}"`
        );
    }

    console.log(
        `Correct Country opened: ${data.code}`
    );


    // =====================================================
    // VERIFY EXISTING COUNTRY NAME
    // =====================================================

    const editCountryName =
        editCountryFrame.getByRole(
            'textbox',
            {
                name: 'Country Name',
                exact: true
            }
        );

    await expect(editCountryName)
        .toHaveValue(data.name);

    console.log(
        `Verified Country Name: ${data.name}`
    );


    // =====================================================
    // UPDATE NATIONALITY
    // =====================================================

    const editNationality =
        editCountryFrame.getByRole(
            'textbox',
            {
                name: 'Nationality',
                exact: true
            }
        );

    await editNationality.fill(
        data.updatedNationality
    );

    // Blur the field so the application registers the value
    await editNationality.press('Tab');

    console.log(
        `Updated Nationality: ${data.updatedNationality}`
    );


    // =====================================================
    // UPDATE (verified)
    // =====================================================

    await clickAndVerifyClosed(
        editCountryIframe,
        editCountryFrame,
        'Country Edit',
        'Update'
    );


    // =====================================================
    // CLEAR
    // =====================================================

    const clearButton =
        page.getByRole(
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
        'Country search cleared'
    );


    // =====================================================
    // COMPLETED
    // =====================================================

    console.log('======================================');
    console.log('COUNTRY TEST COMPLETED SUCCESSFULLY');
    console.log('======================================');

});