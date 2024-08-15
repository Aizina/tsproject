export interface RandomUser {
    gender: string;
    name: {
        title: string;
        first: string;
        last: string;
    };
    location: {
        street: {
            number: number;
            name: string;
        };
        city: string;
        state: string;
        country: string;
        postcode: string;
        coordinates: {
            latitude: string;
            longitude: string;
        };
        timezone: {
            offset: string;
            description: string;
        };
    };
    email: string;
    login: {
        uuid: string;
        username: string;
        password: string;
        salt: string;
        md5: string;
        sha1: string;
        sha256: string;
    };
    dob: {
        date: string;
        age: number;
    };
    registered: {
        date: string;
        age: number;
    };
    phone: string;
    cell: string;
    id: {
        name: string;
        value: string | null;
    };
    picture: {
        large: string;
        medium: string;
        thumbnail: string;
    };
    nat: string;
}

export class User {
    async fetchRandomUser(): Promise<RandomUser | null> {
        try {
            const response = await fetch('https://randomuser.me/api/');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.results[0] as RandomUser;
        } catch (error) {
            console.error('Error fetching random user:', error);
            return null;
        }
    }
}
