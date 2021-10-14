/* Import external classes first */
import express from 'express';
import superagent from 'superagent';
import prefix from 'superagent-prefix';

/* Import local classes */
import Config from './config';

const app = express();
const port = 3000;

const settings: Config = require('./settings.json');

app.get('/', (req, res) => {
	res.send('May I help you?');
});

/* Gets the list of breaches from haveibeenpwned.com */
function getBreaches(email: string) {
	return superagent
		.get('/breachedaccount/' + email)
		.use(prefix('https://haveibeenpwned.com/api/v3'))
		.set('hibp-api-key', settings.apikey)
		.set('user-agent', 'lwac')
		.query({ truncateResponse: settings.truncate === undefined ? true : settings.truncate })
		.then(res => {
			return res.body;
		})
		.catch(err => {
			return err.response.text;
		});
};

app.get('/breaches',  (req, res) => {
	switch (typeof req.query.email) {
	case 'string':
		getBreaches(req.query.email).then(breaches => {
			res.send(breaches);
		});

		break;
	case 'object': /* Array of email is supported, but please don't actually do this. */
		const emails: string[] = (req.query.email as string[]);

		const promises = emails.map(item => {
			return getBreaches(item).then(breaches => { return breaches });
		});
		Promise.all(promises).then((results) => { res.send(results) });

		break;
	default:
		res.send("Email address was not specified.");

		break;
	}

});

app.get('/breaches/:email',  (req, res) => {
	const email: string = req.params.email;

	getBreaches(email).then(breaches => { res.send(breaches); });
});

app.listen(port, () => { return; });
