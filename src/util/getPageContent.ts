import normalizeTitle from './normalizeTitle';

/**
 * Get the content of a page on-wiki.
 *
 * @param page
 * @param extraOptions
 * @return A promise resolving to the page content
 */
export default function (
	page: mw.Title|string|number,
	extraOptions: Record<string, any> = {}
): PromiseLike<string & { contentFormat: string }> {
	return window.deputy.wiki.get( {
		action: 'query',
		prop: 'revisions',
		...( typeof page === 'number' ? {
			pageids: page
		} : {
			titles: normalizeTitle( page ).getPrefixedText()
		} ),
		rvprop: 'content',
		rvslots: 'main',
		rvlimit: '1',
		...extraOptions
	} ).then( ( data ) => {
		return Object.assign(
			data.query.pages[ 0 ].revisions[ 0 ].slots.main.content,
			{ contentFormat: data.query.pages[ 0 ].revisions[ 0 ].slots.main.contentformat }
		);
	} );
}
