describe('CypressMocha', () => {
    it('[C1234] can perform a successful login', () => {
        cy.visit('https://the-internet.herokuapp.com/login');
        cy.get('#username').type('tomsmith');
        cy.get('#password').type('SuperSecretPassword!');
        cy.get('button.radius').click();
        cy.contains('You logged into a secure area!');
    })
})