import { AbstractLevelDOWN } from 'abstract-leveldown';

import { CodecOptions } from 'level-codec';
export { CodecOptions, CodecEncoder } from 'level-codec';

export interface EncodingDOWN<K=any, V=any, O={}, PO={}, GO={}, DO={}, IO={}, BO={}> extends AbstractLevelDOWN<
  K, V, O, PO & CodecOptions, GO & CodecOptions, DO & CodecOptions, IO & CodecOptions, BO & CodecOptions> {
}

interface EncodingDOWNConstructor {
  <K=any, V=any, O={}, PO={}, GO={}, DO={}, IO={}, BO={}>(
    db: AbstractLevelDOWN<any, any, O, PO, GO, DO, IO, BO>,
    options?: CodecOptions
  ): EncodingDOWN<K, V, O, PO, GO, DO, IO, BO>
  new <K=any, V=any, O={}, PO={}, GO={}, DO={}, IO={}, BO={}>(
    db: AbstractLevelDOWN<any, any, O, PO, GO, DO, IO, BO>,
    options?: CodecOptions
  ): EncodingDOWN<K, V, O, PO, GO, DO, IO, BO>
}

declare const EncodingDOWN: EncodingDOWNConstructor;
export default EncodingDOWN;