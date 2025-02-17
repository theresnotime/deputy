import typescript from 'rollup-plugin-typescript2';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { string } from 'rollup-plugin-string';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import license from 'rollup-plugin-node-license';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Converts standard text to block comments.
 *
 * @param text The text to block comment-ify.
 * @return {string} Block comment-ified text.
 */
function blockCommentIfy( text ) {
	let final = '';
	const lines = text.toString().split( '\n' );
	for ( const lineNo in lines ) {
		const line = lines[ lineNo ];

		if ( +lineNo === 0 ) {
			final += `/*!\n * ${line}\n`;
		} else if ( +lineNo === lines.length - 1 ) {
			final += ` * ${line}\n */`;
		} else {
			final += ` * ${line}\n`;
		}
	}
	return final;
}

/**
 * @type {import('rollup').RollupOptions}
 */
export default {
	input: 'src/Deputy.ts',
	output: {
		dir: 'build',
		format: 'iife',
		banner: blockCommentIfy( fs.readFileSync( path.join( __dirname, 'BANNER.txt' ) ) )
	},
	plugins: [
		commonjs(),
		nodeResolve( { browser: true } ),
		typescript(),
		json(),
		string( { include: 'src/css/*.css' } ),
		license()
	]
};
