import { googleSheetProvider } from './providers/googleSheetProvider';
import { DataProvider } from './dataProvider';

export const dataProvider: DataProvider = googleSheetProvider;
