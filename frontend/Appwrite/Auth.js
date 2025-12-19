import {Account, Client, Database} from 'appwrite'

class AuthService {
    client = new Client()
    account

    constructor() {
        this.client
            .setProject()
            .setEndpoint('https://<REGION>.cloud.appwrite.io/v1')
        this.account = Account(this.client)
    }


    async GuestAccount() {
        try {
            return await this.account.createAnonymousSession()
        }
        catch(error){
            console.error('Guest Session : ', error)
        }
    }



}