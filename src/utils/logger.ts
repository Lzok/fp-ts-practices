import { inspect } from 'util';
import { createLogger, format, transports } from 'winston';

// Original logger config created by Hernan Rajchert https://github.com/hrajchert
const logger = createLogger({
	level: 'debug',
	transports: [
		new transports.Console({
			format: format.combine(
				format.align(),
				format.colorize({
					level: true,
				}),
				format.printf(({ level, message, ...extra }) => {
					// Get the array of extra properties provided. For some reason TS doesn't
					// allow accesing by symbol so we use the as any, and we provide an empty
					// array as fallback.
					const splat: any[] = extra[Symbol.for('splat') as any] || [];
					return [
						`${level}: ${message}`,
						...splat
							.map((any) => inspect(any))
							// Indent every item in the splat with a tab, and make sure that if the string
							// has a new line, that line is also indented
							.map((str) => '\t' + str.replace(/\n/g, '\n\t')),
					].join('\n');
				})
			),
		}),
	],
});

export default logger;
