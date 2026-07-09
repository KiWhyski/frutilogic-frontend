/**
 * Sign up request model
 * @summary
 * Represents a sign-up request. This is used to register a user.
 */
export class SignUpRequest {
    /**
     * Constructor
     * @param {string} username The username of the user.
     * @param {string} password The password of the user.
     * @param {string} validatePassword Function to validate the password.
     * @param {string} businessName The name of the business associated with the user.
     * @param {string} accountRole The role of the user in the account.
     */
    constructor(username, password, validatePassword, businessName, accountRole) {
        this.username = username;
        this.password = password;
        this.validatePassword = validatePassword;
        this.name = businessName;
        this.businessName = businessName;
        this.accountRole = accountRole;
    }
}