class CommonMethods {

    constructor(page) {
        this.page = page;
    }

    async wait() {
        await this.page.waitForTimeout(700);
    }

    async new(scope = this.page) {
        await scope.getByRole('button', { name: 'New', exact: true }).first().click();
    }

    async search(scope = this.page) {
        await scope.getByRole('button', { name: 'Search', exact: true }).first().click();
    }

    async clear(scope = this.page) {
        await scope.getByRole('button', { name: 'Clear', exact: true }).first().click();
        await this.wait();
    }

    async edit(scope = this.page) {
        await scope.getByRole('link', { name: 'Edit', exact: true }).first().click();
    }

    async save(frame) {
        await frame.getByRole('button', { name: 'Save', exact: true }).click();
        await this.wait();

        // Confirm the popup actually closed. If the Save button is still
        // visible/present, the save was likely rejected by validation and
        // the form never closed - fail loudly instead of continuing on
        // to search/edit against a stale, still-open popup.
        const stillOpen = await frame
            .getByRole('button', { name: 'Save', exact: true })
            .isVisible()
            .catch(() => false);

        if (stillOpen) {
            throw new Error(
                'Save did not close the popup - check for a validation error on the form ' +
                '(e.g. required field, code length/format, or duplicate value).'
            );
        }
    }

    async update(frame) {
        await frame.getByRole('button', { name: 'Update', exact: true }).click();
        await this.wait();

        const stillOpen = await frame
            .getByRole('button', { name: 'Update', exact: true })
            .isVisible()
            .catch(() => false);

        if (stillOpen) {
            throw new Error(
                'Update did not close the popup - check for a validation error on the form.'
            );
        }
    }

    async dialogSearch(value) {
        const d = this.page.getByRole('dialog', { name: 'Search' });
        const b = d.getByRole('textbox').first();

        await b.fill(value);
        await b.press('Enter');
        await this.wait();

        return d;
    }

    async select(value) {
        const d = this.page.getByRole('dialog', { name: 'Search' });
        const e = d.getByRole('gridcell', { name: value, exact: true });

        if (await e.count()) return e.first().click();

        return d.getByRole('gridcell').first().click();
    }

    frame(title) {
        // Match the iframe title as a trimmed substring, so exact whitespace
        // differences in the real title attribute (e.g. a trailing space)
        // don't cause the lookup to silently fail.
        const trimmed = title.trim();
        return this.page
            .locator(`xpath=//iframe[contains(normalize-space(@title), "${trimmed}")]`)
            .first()
            .contentFrame();
    }
}

module.exports = CommonMethods;