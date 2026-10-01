const { test } = require('@playwright/test');

const CommonNavigation = require('../pages/CommonNavigation');

test('Common Module - Delivery Modes Add Search Edit Clear', async ({ page }) => {

    // ==========================================
    // TEST DATA (change code before each run - duplicates are rejected)
    // ==========================================

    const data = {
        code: 'ZT',
        leadTimeDays: '8',
        deliveryType: 'Others',
        description: 'Warehouse G team',
        updatedDescription: 'Warehouse G Team Updated',
    };

    console.log('Delivery Mode Data:', data);


    // ==========================================
    // HELPERS - EXACT, CASE-INSENSITIVE MATCHING
    // (the app may save "Zg" as "ZG"; "JF" must not match "DJF")
    // ==========================================

    function escapeRegExp(text) {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    const exactCode = new RegExp(
        `^\\s*${escapeRegExp(data.code)}\\s*$`,
        'i'
    );


    // ==========================================
    // HELPER - FAST LOV SELECTION
    // Stage 1: search icon   (4s)
    // Stage 2: Enter key     (4s)
    // Stage 3: Show More     (up to 5 times)
    // ==========================================

    async function selectFromLov(searchDialog, searchBox, searchIcon, value) {

        const result = searchDialog
            .locator('[role="gridcell"], [role="rowheader"], td')
            .filter({
                hasText: new RegExp(
                    `^\\s*${escapeRegExp(value)}\\s*$`,
                    'i'
                )
            })
            .first();

        const isFound = (ms) =>
            result
                .waitFor({
                    state: 'visible',
                    timeout: ms
                })
                .then(() => true)
                .catch(() => false);

        await searchBox.fill(value);

        console.log(
            `Searching Delivery Mode Code: ${value}`
        );

        // Stage 1: search icon
        await searchIcon.waitFor({
            state: 'visible',
            timeout: 10000
        });

        await searchIcon.click();

        console.log(
            'Delivery Mode search icon clicked'
        );

        let found = await isFound(4000);

        // Stage 2: Enter key
        if (!found) {

            console.log(
                'LOV: not found after search icon. Pressing Enter...'
            );

            await searchBox.press('Enter');

            found = await isFound(4000);
        }

        // Stage 3: paged list -> Show More
        if (!found) {

            const showMore = searchDialog.getByText(
                'Show More',
                {
                    exact: true
                }
            );

            for (let i = 1; i <= 5 && !found; i++) {

                if (!(await showMore.count())) {
                    break;
                }

                console.log(
                    `LOV: clicking Show More (${i})`
                );

                await showMore.first().click();

                found = await isFound(3000);
            }
        }

        if (!found) {

            const content = await searchDialog
                .innerText()
                .catch(() => '(unreadable)');

            console.log(
                'LOV content was:\n' + content.slice(0, 1500)
            );

            throw new Error(
                `Delivery Mode "${value}" not found in search dialog`
            );
        }

        await result.scrollIntoViewIfNeeded();

        await result.click();

        console.log(
            `Delivery Mode selected: ${value}`
        );
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

    await page.getByRole(
        'textbox',
        {
            name: 'Username'
        }
    ).fill('Subiksha');

    await page.getByRole(
        'textbox',
        {
            name: 'Password'
        }
    ).fill('Subiksha@4321');

    await page.getByRole(
        'button',
        {
            name: 'Sign In',
            exact: true
        }
    ).click();

    console.log('Login successful');


    // ==========================================
    // SWITCH ROLE
    // ==========================================

    const switchRoleBtn =
        page.locator(
            'li.a-switchRole button'
        ).first();

    const commonMenuItem =
        page.getByRole(
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
    // WAIT FOR COMMON MENU
    // ==========================================

    let menuOpened =
        await commonMenuItem
            .waitFor({
                state: 'visible',
                timeout: 5000
            })
            .then(() => true)
            .catch(() => false);


    if (!menuOpened) {

        console.log(
            'Switch Role menu did not open on first click, retrying...'
        );

        await switchRoleBtn.click();

        await commonMenuItem.waitFor({
            state: 'visible',
            timeout: 30000
        });
    }


    // ==========================================
    // HANDLE BROWSER DIALOG
    // ==========================================

    page.once('dialog', dialog => {

        console.log(
            `Dialog message: ${dialog.message()}`
        );

        dialog.dismiss().catch(() => {});

    });


    // ==========================================
    // SELECT COMMON ROLE
    // ==========================================

    await commonMenuItem.click();

    await page.waitForTimeout(2000);


    // ==========================================
    // NAVIGATE TO DELIVERY MODES
    // ==========================================

    const nav =
        new CommonNavigation(page);

    await nav.open(
        'Delivery Modes'
    );


    // ==========================================
    // ADD
    // ==========================================

    const clearBeforeNew =
        page.getByRole(
            'button',
            {
                name: 'Clear',
                exact: true
            }
        ).first();

    await clearBeforeNew.click();

    await page.waitForTimeout(700);


    await page.getByRole(
        'button',
        {
            name: 'New',
            exact: true
        }
    ).click();

    console.log(
        'New button clicked'
    );


    // ==========================================
    // DELIVERY MODES IFRAME
    // ==========================================

    const deliveryModesIframe =
        page.locator(
            'xpath=//iframe[contains(normalize-space(@title), "Delivery Modes")]'
        ).first();

    await deliveryModesIframe.waitFor({
        state: 'visible',
        timeout: 30000
    });

    const frame =
        deliveryModesIframe.contentFrame();


    // ==========================================
    // CODE
    // ==========================================

    const codeField =
        frame.getByRole(
            'textbox',
            {
                name: 'Code',
                exact: true
            }
        );

    await codeField.waitFor({
        state: 'visible',
        timeout: 30000
    });

    await codeField.fill(
        data.code
    );

    console.log(
        `Delivery Mode Code: ${data.code}`
    );


    // ==========================================
    // LEAD TIME DAYS
    // ==========================================

    const leadTimeField =
        frame.getByRole(
            'textbox',
            {
                name: 'Lead Time (Days)',
                exact: true
            }
        );

    await leadTimeField.fill(
        data.leadTimeDays
    );

    console.log(
        `Lead Time Days: ${data.leadTimeDays}`
    );


    // ==========================================
    // DELIVERY TYPE
    // ==========================================

    await frame.getByRole(
        'combobox',
        {
            name: 'Delivery Type',
            exact: true
        }
    ).click();

    await page.getByRole(
        'option',
        {
            name: data.deliveryType,
            exact: true
        }
    ).click();

    console.log(
        `Delivery Type: ${data.deliveryType}`
    );


    // ==========================================
    // DESCRIPTION
    // ==========================================

    const descField =
        frame.getByRole(
            'textbox',
            {
                name: 'Description',
                exact: true
            }
        );

    await descField.fill(
        data.description
    );

    console.log(
        `Description: ${data.description}`
    );


    // ==========================================
    // SAVE
    // ==========================================

    const saveButton =
        frame.getByRole(
            'button',
            {
                name: 'Save',
                exact: true
            }
        );

    await saveButton.waitFor({
        state: 'visible',
        timeout: 30000
    });

    await saveButton.click();

    console.log(
        'Delivery Modes Save clicked'
    );

    await page.waitForTimeout(1500);


    // ==========================================
    // CHECK SAVE POPUP
    // ==========================================

    const popupStillOpenAfterSave =
        await deliveryModesIframe
            .isVisible()
            .catch(() => false);


    if (popupStillOpenAfterSave) {

        console.log(
            'Delivery Modes popup is still open after Save'
        );


        const visibleDeliveryDialog =
            page.locator(
                '.ui-dialog:visible'
            )
            .filter({
                has: page.locator(
                    'iframe[title*="Delivery Modes"]'
                )
            })
            .first();


        if (await visibleDeliveryDialog.count()) {

            const closeButton =
                visibleDeliveryDialog.locator(
                    '.ui-dialog-titlebar-close'
                );

            await closeButton.waitFor({
                state: 'visible',
                timeout: 10000
            });

            await closeButton.click();

            console.log(
                'Delivery Modes popup closed using X'
            );
        }

    } else {

        console.log(
            'Delivery Modes popup already closed after Save'
        );
    }


    // ==========================================
    // WAIT FOR SAVE OVERLAY
    // ==========================================

    const saveOverlay =
        page.locator(
            '.ui-widget-overlay.ui-front'
        );

    if (await saveOverlay.count()) {

        await saveOverlay
            .first()
            .waitFor({
                state: 'hidden',
                timeout: 15000
            })
            .catch(() => {

                console.log(
                    'Save overlay already disappeared'
                );

            });
    }

    await page.waitForTimeout(1000);


    // ==========================================
    // SEARCH
    // ==========================================

    console.log(
        'Opening Delivery Mode search'
    );

    const deliveryModeCombobox =
        page.getByRole(
            'combobox',
            {
                name: 'Delivery Mode',
                exact: true
            }
        );

    await deliveryModeCombobox.waitFor({
        state: 'visible',
        timeout: 30000
    });

    await deliveryModeCombobox.click();

    console.log(
        'Delivery Mode search opened'
    );


    // ==========================================
    // SEARCH DIALOG
    // ==========================================

    const searchDialog =
        page.getByRole(
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
    // SEARCH BOX + SEARCH ICON
    // ==========================================

    const searchBox =
        searchDialog
            .getByRole(
                'textbox'
            )
            .first();

    const searchIcon =
        searchBox
            .locator('xpath=..')
            .getByRole(
                'button'
            )
            .first();


    // ==========================================
    // SELECT DELIVERY MODE FROM LOV (fast, case-insensitive)
    // ==========================================

    await selectFromLov(
        searchDialog,
        searchBox,
        searchIcon,
        data.code
    );


    // ==========================================
    // CLICK MAIN SEARCH BUTTON
    // ==========================================

    await page.getByRole(
        'button',
        {
            name: 'Search',
            exact: true
        }
    ).click();

    console.log(
        'Delivery Mode Search button clicked'
    );

    await page.waitForTimeout(1000);


    // ==========================================
    // FIND CREATED RECORD (exact code cell - not just "contains")
    // ==========================================

    const row =
        page.getByRole(
            'row'
        )
        .filter({
            has: page
                .locator('[role="gridcell"], [role="rowheader"], td')
                .filter({
                    hasText: exactCode
                })
        })
        .first();

    await row.waitFor({
        state: 'visible',
        timeout: 30000
    });

    const rowText = await row.innerText();

    console.log(
        `Delivery Mode result row: ${rowText.replace(/\s+/g, ' ').trim()}`
    );

    console.log(
        'Delivery Mode record found'
    );


    // ==========================================
    // EDIT (inside the SAME exact row only)
    // ==========================================

    await row.getByRole(
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
    // REACQUIRE EDIT IFRAME
    // ==========================================

    const editDeliveryModesIframe =
        page.locator(
            'xpath=//iframe[contains(normalize-space(@title), "Delivery Modes")]'
        ).first();

    await editDeliveryModesIframe.waitFor({
        state: 'visible',
        timeout: 30000
    });

    const editFrame =
        editDeliveryModesIframe.contentFrame();


    // ==========================================
    // VERIFY OPENED DELIVERY MODE CODE
    // ==========================================

    const editCodeField =
        editFrame.getByRole(
            'textbox',
            {
                name: 'Code',
                exact: true
            }
        );

    await editCodeField.waitFor({
        state: 'visible',
        timeout: 30000
    });

    const openedCode =
        (await editCodeField.inputValue()).trim();

    console.log(
        `Opened Delivery Mode Code: ${openedCode}`
    );

    if (
        openedCode.toUpperCase() !==
        data.code.trim().toUpperCase()
    ) {

        throw new Error(
            `Wrong Delivery Mode opened. Expected "${data.code}" but found "${openedCode}"`
        );
    }

    console.log(
        `Correct Delivery Mode opened: ${data.code}`
    );


    // ==========================================
    // EDIT DESCRIPTION
    // ==========================================

    const editDescField =
        editFrame.getByRole(
            'textbox',
            {
                name: 'Description',
                exact: true
            }
        );

    await editDescField.waitFor({
        state: 'visible',
        timeout: 30000
    });

    await editDescField.fill(
        data.updatedDescription
    );

    console.log(
        `Updated Description: ${data.updatedDescription}`
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
        'Delivery Modes Update clicked'
    );

    await page.waitForTimeout(1500);


    // ==========================================
    // CHECK UPDATE POPUP
    // ==========================================

    const popupStillOpenAfterUpdate =
        await editDeliveryModesIframe
            .isVisible()
            .catch(() => false);


    if (popupStillOpenAfterUpdate) {

        console.log(
            'Delivery Modes popup is still open after Update'
        );


        const visibleEditDialog =
            page.locator(
                '.ui-dialog:visible'
            )
            .filter({
                has: page.locator(
                    'iframe[title*="Delivery Modes"]'
                )
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
                'Delivery Modes edit popup closed using X'
            );
        }

    } else {

        console.log(
            'Delivery Modes edit popup already closed after Update'
        );
    }


    // ==========================================
    // WAIT FOR UPDATE OVERLAY
    // ==========================================

    const updateOverlay =
        page.locator(
            '.ui-widget-overlay.ui-front'
        );

    if (await updateOverlay.count()) {

        await updateOverlay
            .first()
            .waitFor({
                state: 'hidden',
                timeout: 15000
            })
            .catch(() => {

                console.log(
                    'Update overlay already disappeared'
                );

            });
    }

    await page.waitForTimeout(1000);


    // ==========================================
    // CLEAR
    // ==========================================

    const clearButton =
        page.getByRole(
            'button',
            {
                name: 'Clear',
                exact: true
            }
        ).first();

    await clearButton.waitFor({
        state: 'visible',
        timeout: 30000
    });

    await clearButton.click();

    console.log(
        'Delivery Mode search cleared'
    );


    // ==========================================
    // TEST COMPLETED
    // ==========================================

    console.log(
        '======================================'
    );

    console.log(
        'DELIVERY MODES TEST COMPLETED'
    );

    console.log(
        '======================================'
    );

});