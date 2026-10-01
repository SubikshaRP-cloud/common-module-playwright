const { test } = require('@playwright/test');

const CommonNavigation = require('../pages/CommonNavigation');

test('Common Module - Payment Modes Add Search Edit Clear', async ({ page }) => {

    // ==========================================
    // TEST DATA
    // ==========================================

    const data = {
        code: 'PAh',
        description: 'APQj',
        applicableFor: 'Purchase',
        updatedDescriptionArabic: 'JHAgkg',
    };

    console.log('Payment Mode Data:', data);


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
    // NAVIGATE TO PAYMENT MODES
    // ==========================================

    const nav = new CommonNavigation(page);

    await nav.open('Payment Modes');


    // ==========================================
    // ADD
    // ==========================================

    await page.getByRole(
        'button',
        {
            name: 'Clear',
            exact: true
        }
    ).first().click();

    await page.waitForTimeout(700);


    await page.getByRole(
        'button',
        {
            name: 'New',
            exact: true
        }
    ).click();

    console.log('New button clicked');


    // ==========================================
    // PAYMENT MODES IFRAME
    // ==========================================

    const paymentModesIframe = page
        .locator(
            'xpath=//iframe[contains(normalize-space(@title), "Payment Modes")]'
        )
        .first();

    await paymentModesIframe.waitFor({
        state: 'visible',
        timeout: 30000
    });

    const frame =
        paymentModesIframe.contentFrame();


    // ==========================================
    // PAYMENT MODE CODE
    // ==========================================

    const codeField = frame.getByRole(
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
        `Payment Mode Code: ${data.code}`
    );


    // ==========================================
    // APPLICABLE FOR
    // ==========================================

    await frame.getByRole(
        'combobox',
        {
            name: 'Applicable for',
            exact: true
        }
    ).click();

    await page.getByRole(
        'option',
        {
            name: data.applicableFor,
            exact: true
        }
    ).click();

    console.log(
        `Applicable For: ${data.applicableFor}`
    );


    // ==========================================
    // DESCRIPTION
    // ==========================================

    const descField = frame.getByRole(
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
    // LOAN APPLICABLE
    // ==========================================

    await frame.getByRole(
        'checkbox',
        {
            name: 'Loan Applicable',
            exact: true
        }
    ).check();


    // ==========================================
    // CREDIT CONTROL FLAG
    // ==========================================

    await frame.getByRole(
        'checkbox',
        {
            name: 'Credit Control Flag',
            exact: true
        }
    ).check();


    // ==========================================
    // SAVE
    // ==========================================

    const saveButton = frame.getByRole(
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
        'Payment Modes Save clicked'
    );

    await page.waitForTimeout(1500);


    // ==========================================
    // CHECK SAVE POPUP
    // ==========================================

    const popupStillOpenAfterSave =
        await paymentModesIframe.isVisible()
            .catch(() => false);


    if (popupStillOpenAfterSave) {

        console.log(
            'Payment Modes popup is still open after Save'
        );


        const visiblePaymentDialog = page
            .locator('.ui-dialog:visible')
            .filter({
                has: paymentModesIframe
            })
            .first();


        if (await visiblePaymentDialog.count()) {

            const closeButton =
                visiblePaymentDialog.locator(
                    '.ui-dialog-titlebar-close'
                );

            await closeButton.waitFor({
                state: 'visible',
                timeout: 10000
            });

            await closeButton.click();

            console.log(
                'Payment Modes popup closed using X'
            );
        }

    } else {

        console.log(
            'Payment Modes popup already closed after Save'
        );
    }


    // ==========================================
    // WAIT FOR SAVE OVERLAY
    // ==========================================

    const saveOverlay = page.locator(
        '.ui-widget-overlay.ui-front'
    );

    if (await saveOverlay.count()) {

        await saveOverlay.first().waitFor({
            state: 'hidden',
            timeout: 15000
        }).catch(() => {

            console.log(
                'Save overlay already disappeared'
            );

        });
    }


    // ==========================================
    // SEARCH
    // ==========================================

    console.log(
        'Opening Payment Mode search'
    );

    const paymentModeCombobox = page.getByRole(
        'combobox',
        {
            name: 'Payment Mode',
            exact: true
        }
    );

    await paymentModeCombobox.waitFor({
        state: 'visible',
        timeout: 30000
    });

    await paymentModeCombobox.click();

    console.log(
        'Payment Mode search opened'
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
    // SEARCH VALUE
    // ==========================================

    const searchBox =
        searchDialog.getByRole(
            'textbox'
        ).first();

    await searchBox.fill(
        data.code
    );

    await searchBox.press(
        'Enter'
    );

    console.log(
        `Searching Payment Mode Code: ${data.code}`
    );


    // ==========================================
    // SELECT SEARCH RESULT
    // ==========================================

    const paymentResult =
        searchDialog.getByText(
            data.code,
            {
                exact: true
            }
        ).first();


    try {

        await paymentResult.waitFor({
            state: 'visible',
            timeout: 10000
        });

        await paymentResult.click();

        console.log(
            `Payment Mode selected: ${data.code}`
        );

    } catch {

        console.log(
            'Exact Payment Mode text not found. Checking result row...'
        );

        const resultRow =
            searchDialog.getByRole(
                'row'
            ).filter({
                hasText: data.code
            }).first();

        await resultRow.waitFor({
            state: 'visible',
            timeout: 20000
        });

        await resultRow.click();

        console.log(
            `Payment Mode selected from row: ${data.code}`
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
        'Payment Mode Search button clicked'
    );

    await page.waitForTimeout(1000);


    // ==========================================
    // FIND PAYMENT MODE ROW
    // ==========================================

    const row =
        page.getByRole(
            'row'
        ).filter({
            hasText: data.code
        }).first();

    await row.waitFor({
        state: 'visible',
        timeout: 30000
    });

    console.log(
        'Payment Mode record found'
    );


    // ==========================================
    // EDIT
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

    const editPaymentModesIframe =
        page.locator(
            'xpath=//iframe[contains(normalize-space(@title), "Payment Modes")]'
        )
        .first();

    await editPaymentModesIframe.waitFor({
        state: 'visible',
        timeout: 30000
    });

    const editFrame =
        editPaymentModesIframe.contentFrame();


    // ==========================================
    // DESCRIPTION ARABIC
    // ==========================================

    const descArabicField =
        editFrame.getByRole(
            'textbox',
            {
                name: 'Description Arabic',
                exact: true
            }
        );

    await descArabicField.waitFor({
        state: 'visible',
        timeout: 30000
    });

    await descArabicField.fill(
        data.updatedDescriptionArabic
    );

    console.log(
        `Updated Description Arabic: ${data.updatedDescriptionArabic}`
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
        'Payment Modes updated'
    );


    // ==========================================
    // WAIT FOR UPDATE PROCESSING
    // ==========================================

    await page.waitForTimeout(1500);


    // ==========================================
    // CHECK WHETHER EDIT POPUP IS STILL OPEN
    // ==========================================

    const popupStillOpenAfterUpdate =
        await editPaymentModesIframe.isVisible()
            .catch(() => false);


    if (popupStillOpenAfterUpdate) {

        console.log(
            'Payment Modes popup is still open after Update'
        );


        // ==========================================
        // FIND VISIBLE PAYMENT MODES DIALOG
        // ==========================================

        const visibleEditDialog =
            page.locator(
                '.ui-dialog:visible'
            )
            .filter({
                has: editPaymentModesIframe
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
                'Payment Modes edit popup closed using X'
            );
        }

    } else {

        console.log(
            'Payment Modes edit popup already closed after Update'
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
        'Payment Modes update popup/overlay handling completed'
    );


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
        );

    await clearButton.waitFor({
        state: 'visible',
        timeout: 30000
    });

    await clearButton.click();

    console.log(
        'Payment Modes search cleared'
    );


    // ==========================================
    // COMPLETED
    // ==========================================

    console.log(
        '======================================'
    );

    console.log(
        'PAYMENT MODES TEST COMPLETED'
    );

    console.log(
        '======================================'
    );

});