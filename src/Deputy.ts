import './types';
import DeputyStorage from './DeputyStorage';
import DeputyCommunications from './DeputyCommunications';
import DeputySession from './session/DeputySession';
import DeputyCasePage from './wiki/DeputyCasePage';
import normalizeTitle from './util/normalizeTitle';
import deputyEnglish from '../i18n/en.json';
import DeputyAPI from './api/DeputyAPI';
import sectionHeadingName from './util/sectionHeadingName';
import ContributionSurveyRow from './models/ContributionSurveyRow';
import getPageContent from './util/getPageContent';
import cloneRegex from './util/cloneRegex';
import { DeputyPreferences } from './DeputyPreferences';
import performHacks from './util/performHacks';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import deputyStyles from './css/deputy.css';
import DeputyCase from './wiki/DeputyCase';

/**
 * The main class for Deputy. Entry point for execution.
 *
 * This class is not exported to avoid circular references and extraneous
 * export code in the Rollup bundle (unnecessary for a userscript).
 */
class Deputy {

	/**
	 * Singleton for this class.
	 *
	 * @private
	 */
	static readonly instance: Deputy = new Deputy();
	readonly DeputyAPI = DeputyAPI;
	readonly DeputyStorage = DeputyStorage;
	readonly DeputySession = DeputySession;
	readonly DeputyPreferences = DeputyPreferences;
	readonly DeputyCommunications = DeputyCommunications;
	readonly DeputyCase = DeputyCase;
	readonly DeputyCasePage = DeputyCasePage;
	readonly models = {
		ContributionSurveyRow: ContributionSurveyRow
	};
	readonly util = {
		cloneRegex: cloneRegex,
		getPageContent: getPageContent,
		normalizeTitle: normalizeTitle,
		sectionHeadingName: sectionHeadingName
	};

	/**
	 * This version of Deputy.
	 *
	 * @type {string}
	 */
	version = '0.0.1';
	/**
	 * The current page as an mw.Title.
	 */
	currentPage = new mw.Title( mw.config.get( 'wgPageName' ) );
	/**
	 * The current page ID.
	 */
	currentPageId = mw.config.get( 'wgArticleId' );

	wiki: mw.Api;
	api: DeputyAPI;
	storage: DeputyStorage;
	prefs: DeputyPreferences;
	comms: DeputyCommunications;
	session: DeputySession;

	/**
	 * OOUI WindowManager. Instantiated only when needed.
	 */
	windowManager: any;

	/**
	 * Private constructor. To access Deputy, use `window.deputy` or Deputy.instance.
	 */
	private constructor() {
		/* ignored */
	}

	/**
	 * Initializes Deputy. By this point, the loader should have succeeded in loading
	 * all dependencies required for Deputy to work. It's only a matter of initializing
	 * sub-components as well.
	 */
	async init() {
		mw.hook( 'deputy.preload' ).fire( this );

		this.wiki = new mw.Api( {
			parameters: {
				format: 'json',
				formatversion: 2,
				utf8: 1,
				errorformat: 'html',
				errorlang: mw.config.get( 'wgUserLanguage' ),
				errorsuselocal: true
			}
		} );

		// Inject CSS
		mw.util.addCSS( deputyStyles );
		// TODO: The goal is to have Deputy load the file for the current wgUserLanguage.
		// Internationalization
		let stringsLoaded = false;
		if ( window.deputyLang ) {
			if ( typeof window.deputyLang === 'object' ) {
				for ( const key in window.deputyLang ) {
					mw.messages.set( key, window.deputyLang[ key ] );
				}
				stringsLoaded = true;
			} else {
				const langFile = await getPageContent( window.deputyLang );
				try {
					if ( langFile.contentFormat !== 'application/json' ) {
						// Anti-pattern, but JSON.parse throws so this catches both of those.
						// noinspection ExceptionCaughtLocallyJS
						throw new Error( 'Language file is not JSON' );
					}

					const langData = JSON.parse( langFile );
					for ( const key in langData ) {
						mw.messages.set( key, langData[ key ] );
					}
					stringsLoaded = true;
				} catch ( e ) {
					mw.notify(
						'Deputy: Requested language page is not a valid JSON file.',
						{ type: 'error' }
					);
				}
			}
		}

		// Run if (a) no deputyLang set, or (b) language file loading fails
		if ( !stringsLoaded ) {
			for ( const key in deputyEnglish ) {
				mw.messages.set( key, ( deputyEnglish as Record<string, string> )[ key ] );
			}
		}

		// Initialize the storage.
		this.storage = new DeputyStorage();
		await this.storage.init();
		// Initialize the Deputy API interface
		this.api = new DeputyAPI();
		// Initialize the Deputy preferences instance
		this.prefs = new DeputyPreferences();
		// Initialize communications
		this.comms = new DeputyCommunications();
		this.comms.init();
		// Initialize session
		this.session = new DeputySession();
		await this.session.init();

		console.log( 'Loaded!' );

		mw.hook( 'deputy.load' ).fire( this );
	}

}

mw.loader.using( [
	'mediawiki.api',
	'mediawiki.Title',
	'oojs'
], function () {
	performHacks();
	window.deputy = Deputy.instance;
	window.deputy.init();
} );

// We only want to export the type, not the actual class. This cuts down on
// code generated and also removes unnecessary exports/module code.
export type { Deputy };
